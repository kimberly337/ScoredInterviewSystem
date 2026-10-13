import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto'
import { promisify } from 'node:util'
import pg from 'pg'
const derive = promisify(scrypt)
const hash = token => createHash('sha256').update(token).digest('hex')
const fail = (status, message) => { const error = new Error(message); error.status = status; throw error }
export const validId = id => /^[a-f0-9-]{36}$/.test(id || '')
export const schema = `
CREATE TABLE IF NOT EXISTS workspace_companies (id uuid PRIMARY KEY, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS workspace_users (id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES workspace_companies(id), email text NOT NULL UNIQUE, role text NOT NULL CHECK(role IN ('admin','member')), password_hash text, disabled boolean NOT NULL DEFAULT false, UNIQUE(company_id,id));
CREATE TABLE IF NOT EXISTS workspace_invites (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES workspace_users(id), expires_at timestamptz NOT NULL, used_at timestamptz);
CREATE TABLE IF NOT EXISTS workspace_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES workspace_users(id), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS workspace_records (id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES workspace_companies(id), kind text NOT NULL CHECK(kind IN ('kit','candidate')), parent_id uuid, payload text NOT NULL, revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(company_id,id), FOREIGN KEY(company_id,parent_id) REFERENCES workspace_records(company_id,id));
CREATE INDEX IF NOT EXISTS workspace_records_company ON workspace_records(company_id,kind);
CREATE TABLE IF NOT EXISTS workspace_audit (id uuid PRIMARY KEY, company_id uuid NOT NULL, user_id uuid NOT NULL, record_id uuid, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
`
export class CompanyStore {
  constructor(db, encryptionKey) {
    this.db = db
    this.key = Buffer.from(encryptionKey || '', 'base64')
    this.available = !!db && this.key.length === 32
    this.ready = null
  }
  async init() {
    if (!this.available) fail(503, 'Company workspaces are not configured yet.')
    if (!this.ready) this.ready = (async()=>{ for(const statement of schema.split(';').filter(s=>s.trim())) await this.db.query(statement) })().catch(error => { this.ready = null; throw error })
    await this.ready
  }
  encrypt(payload, companyId) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key, iv)
    cipher.setAAD(Buffer.from(companyId))
    return [iv.toString('base64'), cipher.update(JSON.stringify(payload), 'utf8', 'base64') + cipher.final('base64'), cipher.getAuthTag().toString('base64')].join('.')
  }
  decrypt(payload, companyId) {
    const [iv, text, tag] = payload.split('.'), decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64'))
    decipher.setAAD(Buffer.from(companyId)); decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return JSON.parse(decipher.update(text, 'base64', 'utf8') + decipher.final('utf8'))
  }
  async invite(companyId, email, role = 'member') {
    await this.init()
    if (!validId(companyId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || email.length > 254 || !['admin','member'].includes(role)) fail(400, 'Enter a valid company, email, and access level.')
    const userId = randomUUID(), token = randomBytes(32).toString('hex')
    const { rows } = await this.db.query('INSERT INTO workspace_users(id,company_id,email,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id', [userId, companyId, email.toLowerCase().trim(), role])
    if (!rows.length) fail(409, 'That email already has an account. Use account recovery instead.')
    await this.db.query("INSERT INTO workspace_invites(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')", [hash(token), userId])
    return { token, userId }
  }
  async createCompany(name, email) {
    await this.init()
    if (!name?.trim() || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) fail(400, 'Enter a company name and administrator email.')
    // Check uniqueness before creating an empty company.
    if ((await this.db.query('SELECT id FROM workspace_users WHERE email=$1', [email.toLowerCase().trim()])).rows.length) fail(409, 'That email already has an account.')
    const id = randomUUID()
    await this.db.query('INSERT INTO workspace_companies(id,name) VALUES($1,$2)', [id, name.trim()])
    const invite = await this.invite(id, email, 'admin')
    return { id, name: name.trim(), ...invite }
  }
  async activate(token, password) {
    await this.init()
    if (!/^[a-f0-9]{64}$/.test(token || '') || typeof password !== 'string' || password.length < 12 || password.length > 256) fail(400, 'Use a valid invitation and a password of 12–256 characters.')
    const salt = randomBytes(16).toString('hex'), key = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
    // Atomic claim prevents simultaneous reuse; a used invite cannot activate another account.
    const { rows } = await this.db.query('UPDATE workspace_invites SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() RETURNING user_id', [hash(token)])
    if (!rows.length) fail(400, 'This invitation has expired or was already used.')
    await this.db.query('UPDATE workspace_users SET password_hash=$1 WHERE id=$2 AND disabled=false', [`${salt}.${key.toString('hex')}`, rows[0].user_id])
    await this.db.query('DELETE FROM workspace_sessions WHERE user_id=$1', [rows[0].user_id])
  }
  async login(email, password) {
    await this.init()
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) fail(401, 'Email or password did not match.')
    const { rows } = await this.db.query('SELECT * FROM workspace_users WHERE email=$1 AND disabled=false', [email.toLowerCase().trim()])
    const user = rows[0], [salt, expected] = (user?.password_hash || '00000000000000000000000000000000.' + '0'.repeat(128)).split('.')
    const actual = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
    if (!user?.password_hash || !timingSafeEqual(actual, Buffer.from(expected, 'hex'))) fail(401, 'Email or password did not match.')
    const token = randomBytes(32).toString('hex')
    await this.db.query("DELETE FROM workspace_sessions WHERE expires_at<now()")
    await this.db.query("INSERT INTO workspace_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')", [hash(token), user.id])
    return token
  }
  async session(token) {
    await this.init()
    if (!/^[a-f0-9]{64}$/.test(token || '')) return null
    const { rows } = await this.db.query('SELECT u.id,u.company_id,u.email,u.role,c.name AS company_name FROM workspace_sessions s JOIN workspace_users u ON s.user_id=u.id JOIN workspace_companies c ON c.id=u.company_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.disabled=false', [hash(token)])
    return rows[0] || null
  }
  async logout(token) { await this.init(); await this.db.query('DELETE FROM workspace_sessions WHERE token_hash=$1', [hash(token || '')]) }
  async members(user) {
    if (user.role !== 'admin') fail(403, 'Company administrator access required.')
    return (await this.db.query('SELECT id,email,role,disabled FROM workspace_users WHERE company_id=$1 ORDER BY email', [user.company_id])).rows
  }
  async recovery(user, id) {
    if (user.role !== 'admin') fail(403, 'Company administrator access required.')
    if (!validId(id)) fail(404, 'User not found.')
    const row = (await this.db.query('SELECT id FROM workspace_users WHERE company_id=$1 AND id=$2 AND disabled=false', [user.company_id,id])).rows[0]
    if (!row) fail(404, 'User not found.')
    const token = randomBytes(32).toString('hex')
    await this.db.query('DELETE FROM workspace_invites WHERE user_id=$1', [id])
    await this.db.query("INSERT INTO workspace_invites(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')", [hash(token), id])
    await this.audit(user, null, 'account_recovery')
    return token
  }
  async disable(user, id) {
    if (user.role !== 'admin') fail(403, 'Company administrator access required.')
    if (id === user.id) fail(400, 'You cannot remove your own access.')
    const { rows } = await this.db.query('UPDATE workspace_users SET disabled=true WHERE company_id=$1 AND id=$2 RETURNING id', [user.company_id, id])
    if (!rows.length) fail(404, 'User not found.')
    await this.db.query('DELETE FROM workspace_sessions WHERE user_id=$1', [id])
  }
  unpack(row, companyId) { return { id: row.id, kind: row.kind, parentId: row.parent_id, revision: row.revision, updatedAt: row.updated_at, archived: !!row.deleted_at, data: this.decrypt(row.payload, companyId) } }
  async list(user, kind, archived = false) {
    return (await this.db.query('SELECT * FROM workspace_records WHERE company_id=$1 AND kind=$2 AND (deleted_at IS NOT NULL)=$3 ORDER BY updated_at DESC', [user.company_id, kind, archived])).rows.map(row => this.unpack(row, user.company_id))
  }
  async get(user, id) {
    if (!validId(id)) fail(404, 'Record not found.')
    const row = (await this.db.query('SELECT * FROM workspace_records WHERE company_id=$1 AND id=$2 AND deleted_at IS NULL', [user.company_id, id])).rows[0]
    if (!row) fail(404, 'Record not found.')
    return this.unpack(row, user.company_id)
  }
  async save(user, input) {
    const { id, kind, parentId = null, revision, data } = input
    if (!validId(id) || !['kit','candidate'].includes(kind) || !data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Invalid record.')
    if (kind === 'kit' && (!data.role?.trim() || !Array.isArray(data.stages) || !Array.isArray(data.items))) fail(400, 'Add a role and complete interview kit.')
    if (kind === 'candidate') {
      if (!validId(parentId) || !data.name?.trim() || data.name.length > 200 || !data.kit || !Array.isArray(data.kit.stages)) fail(400, 'Add a candidate name and saved opening.')
      const parent = await this.get(user, parentId)
      if (parent.kind !== 'kit') fail(400, 'Invalid opening.')
      if (revision === 0 && (!parent.data.approved || !parent.data.items.length)) fail(400, 'Approve and save the interview kit before adding candidates.')
      // Questions are an immutable copy of the approved kit; later edits cannot change a candidate's scoring criteria.
      data.answers ||= {}; data.references ||= {}; data.interviews ||= {}; data.summary ||= ''
      const validAnswers = answers => answers && typeof answers === 'object' && !Array.isArray(answers) && Object.values(answers).every(a => a && typeof a === 'object' && (a.notes === undefined || typeof a.notes === 'string') && (a.rating === undefined || ['', 'Not observed', '1', '2', '3', '4', '5'].includes(a.rating)) && (a.requirement === undefined || ['', '3 — Meets role requirements', '0 — Does not meet role requirements', 'Pending — Insufficient evidence'].includes(a.requirement)))
      if (!validAnswers(data.answers) || !data.references || typeof data.references !== 'object' || Array.isArray(data.references) || Object.values(data.references).some(refs => !Array.isArray(refs) || refs.some(ref => !validId(ref.id) || !validAnswers(ref.answers)))) fail(400, 'Invalid scorecard answers.')
      if (revision === 0) data.kit = parent.data
      else {
        const existing = await this.get(user, id)
        if (existing.kind !== kind || existing.parentId !== parentId) fail(400, 'Record type and opening cannot be changed.')
        data.kit = existing.data.kit
      }
    }
    const encrypted = this.encrypt(data, user.company_id)
    let rows
    if (revision === 0) {
      rows = (await this.db.query('INSERT INTO workspace_records(id,company_id,kind,parent_id,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING RETURNING *', [id, user.company_id, kind, parentId, encrypted])).rows
    } else if (Number.isInteger(revision) && revision > 0) {
      rows = (await this.db.query('UPDATE workspace_records SET payload=$1,revision=revision+1,updated_at=now() WHERE company_id=$2 AND id=$3 AND revision=$4 AND kind=$5 AND parent_id IS NOT DISTINCT FROM $6 AND deleted_at IS NULL RETURNING *', [encrypted, user.company_id, id, revision, kind, parentId])).rows
    } else fail(400, 'Invalid record version.')
    if (!rows.length) fail(409, 'This record changed in another window. Save a copy of your notes, then reload the record before editing.')
    await this.audit(user, id, revision === 0 ? 'create' : 'save')
    return this.unpack(rows[0], user.company_id)
  }
  async archive(user, id, restore = false) {
    if (user.role !== 'admin') fail(403, 'Company administrator access required.')
    if (!validId(id)) fail(404, 'Record not found.')
    const { rows } = await this.db.query(`UPDATE workspace_records SET deleted_at=${restore ? 'NULL' : 'now()'},revision=revision+1,updated_at=now() WHERE company_id=$1 AND id=$2 RETURNING id`, [user.company_id,id])
    if (!rows.length) fail(404, 'Record not found.')
    await this.audit(user,id,restore ? 'restore' : 'archive')
  }
  async audit(user, id, action) { await this.db.query('INSERT INTO workspace_audit(id,company_id,user_id,record_id,action) VALUES($1,$2,$3,$4,$5)', [randomUUID(),user.company_id,user.id,id,action]) }
}
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }) : null
export const companyStore = new CompanyStore(pool, process.env.WORKSPACE_ENCRYPTION_KEY)
export const companiesEnabled = process.env.COMPANY_ACCOUNTS_ENABLED === 'true'
export async function closeCompanies() { await pool?.end() }
