import { createServer } from 'node:http'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getErrorSummary, recordError, closeStore } from './errorStore.mjs'
import { draftWithAI } from './aiDraft.mjs'

const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)))
const password = process.env.ADMIN_PASSWORD || ''
const sessionKey = randomBytes(32)
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
const rates = new Map()
const headers = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' }
const adminHeaders = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" }
function send(res, status, body = '', extra = {}) { res.writeHead(status, { ...headers, ...extra }).end(body) }
function escape(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]) }
function equal(a, b) { return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest()) }
function originOkay(req) { try { return new URL(req.headers.origin).host === req.headers.host } catch { return false } }
function rate(key, max) {
  const now = Date.now(), old = rates.get(key), item = old && now - old.start < 60_000 ? old : { start: now, count: 0 }
  item.count += 1
  rates.set(key, item)
  if (rates.size > 1000) for (const [k, value] of rates) if (now - value.start > 60_000) rates.delete(k)
  return item.count <= max
}
async function body(req, max = 4096) {
  let value = ''
  for await (const chunk of req) { value += chunk.toString('utf8'); if (Buffer.byteLength(value) > max) throw new Error('BodyTooLarge') }
  return value
}
function validSession(req) {
  const token = (req.headers.cookie || '').split('; ').find(part => part.startsWith('ef_admin='))?.slice(9)
  if (!token) return false
  const [expiry, nonce, signature] = token.split('.')
  if (!/^\d{13}$/.test(expiry || '') || !/^[a-f0-9]{32}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '') || +expiry < Date.now()) return false
  return equal(signature, createHmac('sha256', sessionKey).update(`${expiry}.${nonce}`).digest('hex'))
}
function cookie(req) {
  const expiry = String(Date.now() + 8 * 60 * 60 * 1000), nonce = randomBytes(16).toString('hex')
  const signature = createHmac('sha256', sessionKey).update(`${expiry}.${nonce}`).digest('hex')
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `ef_admin=${expiry}.${nonce}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`
}
function page(content, refresh = false) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${refresh ? '<meta http-equiv="refresh" content="30">' : ''}<title>Error monitor | E Factor Leadership</title><style>
  :root{font-family:Montserrat,Arial,sans-serif;color:#282334;background:#f8f5f9}body{margin:0}header{background:#45266c;color:white;padding:22px max(22px,5vw)}header span{color:#cde1d0}main{max-width:1100px;margin:40px auto;padding:0 24px}h1{font-size:32px}h2{font-size:19px}.card{background:white;border:1px solid #ddd5e4;padding:24px;margin:20px 0}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.stats strong{display:block;font-size:32px;color:#45266c}.muted{color:#655d6b}label{display:block;margin:18px 0 7px}input{padding:12px;width:min(400px,90%);border:1px solid #a99bb2;font:inherit}button{background:#45266c;color:white;padding:12px 20px;border:0;font:inherit;font-weight:700;cursor:pointer}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;border-bottom:1px solid #e8e1ec;padding:12px 9px;vertical-align:top}th{color:#45266c}code{overflow-wrap:anywhere}.scroll{overflow-x:auto}.notice{border-left:4px solid #487a52;padding:12px 16px;background:#ebf2eb}@media(max-width:640px){.stats{grid-template-columns:1fr}}
  </style></head><body><header><strong>E FACTOR <span>LEADERSHIP</span></strong> · Error monitor</header><main>${content}</main></body></html>`
}
function login(error = '') { return page(`<h1>Admin sign in</h1><p class="muted">Enter the admin password configured in Railway.</p>${error ? `<p class="notice">${escape(error)}</p>` : ''}<section class="card"><form method="post" action="/admin/login"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><p><button type="submit">Sign in</button></p></form></section>`) }
async function dashboard() {
  const { mode, events, counts } = await getErrorSummary()
  const rows = events.map(e => `<tr><td>${escape(new Date(e.last_seen).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }))} UTC</td><td>${escape(e.source)} / ${escape(e.category)}</td><td>${escape(e.kind)}</td><td><code>${escape(e.asset || '—')}${e.line ? ':' + Number(e.line) : ''}</code></td><td>${Number(e.occurrences)}</td></tr>`).join('')
  return page(`<h1>Application errors</h1><p class="muted">Updates every 30 seconds. Reports contain error types and code locations only. They do not contain job descriptions, form entries, candidate details, messages, or stacks.</p>${mode === 'memory' ? '<p class="notice">Temporary view: no database connection. Events disappear when the server restarts; Railway logs still record error codes.</p>' : '<p class="notice">Persistent storage connected. Error groups are kept for 90 days after the latest occurrence.</p>'}<div class="stats"><section class="card"><strong>${Number(counts.last_day)}</strong>Groups active in 24 hours</section><section class="card"><strong>${Number(counts.distinct_errors)}</strong>Distinct error groups</section><section class="card"><strong>${Number(counts.total_occurrences)}</strong>Total occurrences</section></div><section class="card"><h2>Recent error groups</h2><div class="scroll"><table><thead><tr><th>Last seen</th><th>Source / category</th><th>Type</th><th>Code location</th><th>Count</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No errors recorded yet.</td></tr>'}</tbody></table></div></section><form method="post" action="/admin/logout"><button type="submit">Sign out</button></form>`, true)
}
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (path === '/api/health' && req.method === 'GET') return send(res, 200, JSON.stringify({ ok: true }), { 'content-type': 'application/json', 'cache-control': 'no-store' })
    if (path === '/api/ai/draft' && req.method === 'POST') {
      const json = { 'content-type': 'application/json', 'cache-control': 'no-store' }
      if (!validSession(req) || !password) return send(res, 401, JSON.stringify({ error: 'Sign in at /admin to use AI drafting.' }), json)
      if (!process.env.OPENAI_API_KEY) return send(res, 503, JSON.stringify({ error: 'Add OPENAI_API_KEY to the Railway app variables.' }), json)
      if (!originOkay(req)) return send(res, 403)
      if (!rate(`ai:${req.socket.remoteAddress}`, 10)) return send(res, 429, JSON.stringify({ error: 'AI drafting limit reached. Try again in an hour.' }), json)
      if (!String(req.headers['content-type']).startsWith('application/json')) return send(res, 415)
      try {
        const result = await draftWithAI(JSON.parse(await body(req, 24000)))
        return send(res, 200, JSON.stringify(result), json)
      } catch (error) {
        const invalid = ['InvalidDraftRequest', 'MissingRoleDetails', 'MissingAssignedCompetencies'].includes(error?.message)
        if (!invalid) await recordError({ source: 'server', category: 'ai_draft_failure', kind: error?.name || 'Error', asset: '', line: 0, column: 0 })
        return send(res, invalid ? 400 : 502, JSON.stringify({ error: invalid ? 'Add a role description and assign competencies to steps first.' : 'AI drafting is unavailable right now. Your current draft is safe.' }), json)
      }
    }
    if (path === '/api/errors' && req.method === 'POST') {
      if (!originOkay(req) || !rate(`event:${req.socket.remoteAddress}`, 120)) return send(res, 429)
      if (!String(req.headers['content-type']).startsWith('application/json')) return send(res, 415)
      let input
      try { input = JSON.parse(await body(req)) } catch { return send(res, 400) }
      if (!['window_error', 'unhandled_rejection', 'render_error', 'job_description_import', 'ai_draft'].includes(input?.category)) return send(res, 400)
      await recordError({ source: 'browser', category: input.category, kind: /^[A-Za-z]{1,40}$/.test(input.kind) ? input.kind : 'UnknownError', asset: /^\/assets\/[A-Za-z0-9_.-]{1,150}$/.test(input.asset) ? input.asset : '', line: Number.isInteger(input.line) && input.line >= 0 && input.line < 1_000_000 ? input.line : 0, column: Number.isInteger(input.column) && input.column >= 0 && input.column < 1_000_000 ? input.column : 0 })
      return send(res, 202)
    }
    if (path === '/admin' && req.method === 'GET') {
      if (!password) return send(res, 503, page('<h1>Admin access is not configured</h1><p>Set ADMIN_PASSWORD in the Railway app service variables to enable this panel.</p>'), adminHeaders)
      const authorized = validSession(req)
      return send(res, authorized ? 200 : 401, authorized ? await dashboard() : login(), adminHeaders)
    }
    if (path === '/admin/login' && req.method === 'POST') {
      if (!password) return send(res, 503)
      if (!originOkay(req)) return send(res, 403, login('Please open the admin page and try again.'), adminHeaders)
      let input
      try { input = new URLSearchParams(await body(req)).get('password') || '' } catch { return send(res, 400) }
      if (!equal(input, password)) {
        const allowed = rate(`login:${req.socket.remoteAddress}`, 10)
        return send(res, allowed ? 401 : 429, login(allowed ? 'The password did not match.' : 'Too many unsuccessful attempts. Wait a minute, then try again.'), { ...adminHeaders, ...(allowed ? {} : { 'retry-after': '60' }) })
      }
      return send(res, 303, '', { ...adminHeaders, location: '/admin', 'set-cookie': cookie(req) })
    }
    if (path === '/admin/logout' && req.method === 'POST') {
      if (!originOkay(req)) return send(res, 403)
      return send(res, 303, '', { ...adminHeaders, location: '/admin', 'set-cookie': 'ef_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' })
    }
    if (path.startsWith('/api/') || path.startsWith('/admin/')) return send(res, 404)
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405)
    const target = resolve(join(root, path.replace(/^\/+/, '')))
    if (target !== root && !target.startsWith(root + sep)) return send(res, 403)
    let file = target
    try { if (!(await stat(file)).isFile()) file = join(root, 'index.html') } catch { file = join(root, 'index.html') }
    const data = await readFile(file)
    return send(res, 200, req.method === 'HEAD' ? undefined : data, { 'content-type': mime[extname(file)] || 'application/octet-stream' })
  } catch (error) {
    await recordError({ source: 'server', category: 'request_failure', kind: error?.name || 'Error', asset: '', line: 0, column: 0 })
    return send(res, 500)
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Interview studio listening on ${process.env.PORT || 3000}`))
process.on('unhandledRejection', error => { void recordError({ source: 'server', category: 'unhandled_rejection', kind: error?.name || 'Error', asset: '', line: 0, column: 0 }) })
process.on('SIGTERM', () => { void closeStore().finally(() => process.exit(0)) })
