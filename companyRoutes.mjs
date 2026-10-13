import { formSecurity } from './formSecurity.mjs'
import { companyStore as defaultStore, companiesEnabled } from './companyStore.mjs'
const jsonHeaders = { 'content-type': 'application/json', 'cache-control': 'no-store' }
const tokenFor = req => (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith('ef_company='))?.slice(11) || ''
const cookie = (req, token, age = 28800) => `ef_company=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
function accountPage(title, content) {
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | E Factor Leadership</title><style>body{font:16px/1.6 Arial,sans-serif;background:#f8f5f9;color:#282334;margin:0}main{max-width:640px;margin:50px auto;padding:24px}img{width:90px}h1{line-height:1.2}.card{background:white;border:1px solid #ddd5e4;border-radius:8px;padding:24px;margin:24px 0}label{display:block;margin:16px 0;font-weight:bold}input,select{display:block;width:100%;box-sizing:border-box;padding:12px;font:inherit;border:1px solid #a99bb2;border-radius:4px}button{background:#45266c;color:white;border:0;padding:13px 20px;font:inherit;cursor:pointer}a{color:#45266c;overflow-wrap:anywhere}.notice{background:#fff2ee;padding:15px;border-left:4px solid #9d442f}</style></head><body><main><img src="/efactor-logo.png" alt="E Factor Leadership"><h1>${esc(title)}</h1>${content}<p><a href="/">Return to Interview Design Studio</a></p></main></body></html>`
}
const htmlHeaders = { 'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'same-origin','content-security-policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" }
const signIn = (error, csrf) => accountPage('Company sign in', `<p>Sign in with your own email and company workspace password.</p>${error ? `<p role="alert" class="notice">${esc(error)}</p>` : ''}<form class="card" method="post" action="/company/sign-in"><input type="hidden" name="csrf" value="${esc(csrf)}"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button>Sign in</button></form><p>Invitation-only pilot. Ask your company administrator for access or password recovery.</p>`)
const activate = (token, error, csrf) => accountPage('Activate your company account', `<p>Your invitation identifies your company and email. Choose your own password, at least 12 characters.</p>${error ? `<p role="alert" class="notice">${esc(error)}</p>` : ''}<form class="card" method="post" action="/company/activate"><input type="hidden" name="csrf" value="${esc(csrf)}"><input name="token" type="hidden" value="${esc(token)}"><label>New password<input name="password" type="password" autocomplete="new-password" required minlength="12" maxlength="256"></label><label>Confirm password<input name="confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="256"></label><button>Activate account</button></form>`)
export async function companyRoutes(req, res, path, { send, body, originOkay, rate, validSession, store = defaultStore, enabled = companiesEnabled, candidateReady = process.env.WORKSPACE_PILOT_READY === 'true' }) {
 const relevant = path.startsWith('/api/company/') || path.startsWith('/company/') || path === '/admin/companies'
 if (!relevant) return false
 const htmlForm = ['/company/sign-in','/company/activate','/admin/companies'].includes(path)
 const form = htmlForm ? formSecurity.prepare(req,path) : null
 const formHeaders = form ? {...htmlHeaders,...form.headers,...(path === '/company/activate' ? {'referrer-policy':'no-referrer'} : {})} : htmlHeaders
 const reply = (status, payload, headers = jsonHeaders) => { send(res,status,typeof payload === 'object' ? JSON.stringify(payload) : payload,headers); return true }
 if (path === '/api/company/status' && req.method === 'GET') return reply(200,{enabled,configured:store.available,candidateReady})
 if (!enabled || !store.available) return reply(503,path.startsWith('/api/') ? {error:'Company accounts need database and encryption configuration before use.'} : accountPage('Company workspaces are being prepared','<p>Company accounts are not enabled yet. Candidate information cannot be saved until setup is complete.</p>'),path.startsWith('/api/') ? jsonHeaders : htmlHeaders)
 try {
  await store.init()
  let formInput
  if (htmlForm && req.method === 'POST') {
    formInput = new URLSearchParams(await body(req,4096))
    const hostileOrigin = req.headers.origin && req.headers.origin !== 'null' && !originOkay(req)
    if (hostileOrigin || req.headers['sec-fetch-site'] === 'cross-site' || !formSecurity.verify(req,path,formInput.get('csrf'))) {
      const error = 'This form has expired or could not be verified. Open a fresh page and try again.'
      if(path === '/company/sign-in') return reply(403,signIn(error,form.token),formHeaders)
      if(path === '/company/activate') return reply(403,activate(formInput.get('token'),error,form.token),formHeaders)
      return reply(403,accountPage('Please reopen company setup',`<p class="notice" role="alert">${error}</p><p><a href="/admin/companies">Open company setup</a></p>`),formHeaders)
    }
  } else if (!['GET','HEAD'].includes(req.method) && !originOkay(req)) return reply(403,{error:'This request could not be verified.'})
  if (path === '/company/sign-in' && req.method === 'GET') return reply(200,signIn(undefined,form.token),formHeaders)
  if (path === '/company/sign-in' && req.method === 'POST') {
   if (!rate(`company-login:${req.socket.remoteAddress}`,10)) return reply(429,signIn('Too many attempts. Wait a minute and try again.',form.token),formHeaders)
   const input = formInput
   try { const token = await store.login(input.get('email'),input.get('password')); return reply(303,'',{...htmlHeaders,location:'/', 'set-cookie':cookie(req,token)}) }
   catch(error) { if (error.status === 401) return reply(401,signIn(error.message,form.token),formHeaders); throw error }
  }
  if (path === '/company/activate' && req.method === 'GET') {
   const token = new URL(req.url,'http://localhost').searchParams.get('token') || ''
   return reply(200,activate(/^[a-f0-9]{64}$/.test(token) ? token : '',undefined,form.token),formHeaders)
  }
  if (path === '/company/activate' && req.method === 'POST') {
   if (!rate(`company-activate:${req.socket.remoteAddress}`,10)) return reply(429,activate('','Too many attempts. Try again in a minute.',form.token),formHeaders)
   const input = formInput
   try {
    if (input.get('password') !== input.get('confirm')) return reply(400,activate(input.get('token'),'Passwords must match.',form.token),formHeaders)
    await store.activate(input.get('token'),input.get('password'))
    return reply(200,accountPage('Account activated','<p>Your account is ready. <a href="/company/sign-in">Sign in to your company workspace</a>.</p>'),htmlHeaders)
   } catch(error) { if(error.status) return reply(error.status,activate(input.get('token'),error.message,form.token),formHeaders); throw error }
  }
  if (path === '/admin/companies') {
   if (!validSession(req)) return reply(401,accountPage('Administrator sign in required','<p><a href="/admin">Open administration and sign in first</a>.</p>'),htmlHeaders)
   let result = ''
   if(req.method === 'POST') {
    const input = formInput
    if (input.get('action') === 'recovery') {
      const account = (await store.db.query("SELECT id,company_id FROM workspace_users WHERE email=$1 AND role='admin' AND disabled=false", [(input.get('email') || '').toLowerCase().trim()])).rows[0]
      if (!account) return reply(404,accountPage('Company administrator not found','<p>Check the email and return to <a href="/admin/companies">company accounts</a>.</p>'),htmlHeaders)
      const token = await store.recovery({role:'admin',company_id:account.company_id,id:'00000000-0000-0000-0000-000000000000'},account.id)
      return reply(200,accountPage('Company administrator recovery',`<p>Share this one-day recovery link privately with the verified account owner.</p><a href="/company/activate?token=${token}">Recover account</a><p><code>/company/activate?token=${token}</code></p>`),htmlHeaders)
    }
    const created = await store.createCompany(input.get('name'),input.get('email'))
    result = `<section class="card"><h2>${esc(created.name)} created</h2><p>Share this one-time, seven-day invitation with the company administrator. This link grants access to their workspace. It is shown once.</p><a href="/company/activate?token=${created.token}">Activate company administrator account</a><p><code>/company/activate?token=${created.token}</code></p></section>`
   }
   return reply(200,accountPage('Company accounts',`${result}<p>Create one private workspace for each pilot company. Invitations are displayed here; no email is sent automatically.</p><form class="card" method="post" action="/admin/companies"><input type="hidden" name="csrf" value="${esc(form.token)}"><label>Company name<input name="name" required maxlength="160"></label><label>Company administrator email<input type="email" name="email" required maxlength="254"></label><button>Create company and invitation</button></form><h2>Recover company administrator access</h2><p>Verify the requester is the account owner before sharing a recovery link.</p><form class="card" method="post" action="/admin/companies"><input type="hidden" name="csrf" value="${esc(form.token)}"><input type="hidden" name="action" value="recovery"><label>Administrator email<input type="email" name="email" required></label><button>Create recovery link</button></form>`),formHeaders)
  }
  const user = await store.session(tokenFor(req))
  if (!user) return reply(401,{error:'Sign in to your company account to continue.'})
  if (path === '/api/company/session' && req.method === 'GET') return reply(200,{user})
  if (path === '/api/company/logout' && req.method === 'POST') { await store.logout(tokenFor(req)); return reply(200,{ok:true},{...jsonHeaders,'set-cookie':cookie(req,'',0)}) }
  if (!rate(`workspace:${user.id}`,180)) return reply(429,{error:'Too many requests. Wait a minute and try again.'})
  if (path === '/api/company/members' && req.method === 'GET') return reply(200,{members:await store.members(user)})
  if (path === '/api/company/invite' && req.method === 'POST') {
   if(user.role !== 'admin') return reply(403,{error:'Company administrator access required.'})
   const input = JSON.parse(await body(req,4096)), invite = await store.invite(user.company_id,input.email,'member')
   return reply(200,{activationPath:`/company/activate?token=${invite.token}`})
  }
  if (path === '/api/company/recovery' && req.method === 'POST') { const input=JSON.parse(await body(req,4096)); const token=await store.recovery(user,input.id); return reply(200,{activationPath:`/company/activate?token=${token}`}) }
  if (path === '/api/company/disable' && req.method === 'POST') { const input=JSON.parse(await body(req,4096)); await store.disable(user,input.id); return reply(200,{ok:true}) }
  if (path === '/api/company/records' && req.method === 'GET') {
   const params = new URL(req.url,'http://localhost').searchParams, kind = params.get('kind')
   if (kind === 'candidate' && !candidateReady) return reply(503,{error:'Candidate records are not enabled yet. Backup setup and recovery verification are still required.'})
   if (!['kit','candidate'].includes(kind)) return reply(400,{error:'Invalid record type.'})
   return reply(200,{records:await store.list(user,kind,params.get('archived') === 'true')})
  }
  if (path === '/api/company/records' && req.method === 'POST') {
   if (!String(req.headers['content-type']).startsWith('application/json')) return reply(415,{error:'JSON required.'})
   const input = JSON.parse(await body(req,512000))
   if(input.kind === 'candidate' && !candidateReady) return reply(503,{error:'Candidate records are not enabled yet. Backup setup and recovery verification are still required.'})
   return reply(200,{record:await store.save(user,input)})
  }
  const match = path.match(/^\/api\/company\/records\/([a-f0-9-]{36})(?:\/(archive|restore))?$/)
  if (match && req.method === 'GET' && !match[2]) { const record=await store.get(user,match[1]); if(record.kind==='candidate' && !candidateReady) return reply(503,{error:'Candidate records are not enabled yet.'}); return reply(200,{record}) }
  if (match && req.method === 'POST' && match[2]) { await store.archive(user,match[1],match[2] === 'restore'); return reply(200,{ok:true}) }
  return reply(404,{error:'Not found.'})
 } catch(error) {
  if (error.status) return htmlForm ? reply(error.status,accountPage('Account setup needs attention',`<p class="notice" role="alert">${esc(error.message)}</p><p><a href="${path}">Open a fresh setup page</a></p>`),formHeaders) : reply(error.status,{error:error.message})
  if (error instanceof SyntaxError) return reply(400,{error:'Invalid request.'})
  // Never log request bodies, query parameters, identifiers, or database exceptions.
  console.error(JSON.stringify({type:'company_workspace_failure',kind:error.name || 'Error'}))
  return htmlForm ? reply(503,accountPage('Account setup is temporarily unavailable',`<p class="notice">Your request could not be completed. Open a fresh page and try again.</p><p><a href="${path}">Try again</a></p>`),formHeaders) : reply(503,{error:'The workspace could not save or load data. Keep your current notes and try again.'})
 }
}
export async function companySession(req) { return companiesEnabled && defaultStore.available ? defaultStore.session(tokenFor(req)) : null }
