import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
const cookieValue = (req, name) => (req.headers.cookie || '').split(/;\s*/).find(c=>c.startsWith(name+'='))?.slice(name.length+1) || ''
const secureRequest = req => req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
export function createFormSecurity(key = randomBytes(32), now = Date.now) {
  const cookieName = req => secureRequest(req) ? '__Host-ef_form' : 'ef_form'
  const signature = (req, path, expiry, nonce) => createHmac('sha256',key).update(JSON.stringify([req.headers.host,path,expiry,nonce,path === '/admin/companies' ? cookieValue(req,'ef_admin') : ''])).digest('hex')
  return {
    prepare(req,path) {
      const name=cookieName(req), current=cookieValue(req,name), nonce=/^[a-f0-9]{64}$/.test(current) ? current : randomBytes(32).toString('hex')
      const expiry=String(now()+60*60*1000)
      return {token:expiry+'.'+signature(req,path,expiry,nonce),headers:{'set-cookie':`${name}=${nonce}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secureRequest(req)?'; Secure':''}`}}
    },
    verify(req,path,token) {
      const nonce=cookieValue(req,cookieName(req)), [expiry,mac,...extra]=String(token || '').split('.')
      if(extra.length || !/^[a-f0-9]{64}$/.test(nonce) || !/^\d{13}$/.test(expiry || '') || !/^[a-f0-9]{64}$/.test(mac || '') || Number(expiry)<now() || Number(expiry)>now()+60*60*1000) return false
      return timingSafeEqual(Buffer.from(mac,'hex'),Buffer.from(signature(req,path,expiry,nonce),'hex'))
    },
  }
}
export const formSecurity=createFormSecurity()
