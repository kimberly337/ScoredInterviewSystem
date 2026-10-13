import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFormSecurity } from '../formSecurity.mjs'
test('signed form tokens bind nonce, host, purpose and administrator session, and expire',()=>{
 let time=1791930000000
 const security=createFormSecurity(Buffer.alloc(32,7),()=>time)
 const req={headers:{host:'tool.example','x-forwarded-proto':'https',cookie:'ef_admin=test-session'}}
 const form=security.prepare(req,'/admin/companies')
 assert.match(form.headers['set-cookie'],/^__Host-ef_form=/)
 for(const flag of ['HttpOnly','SameSite=Strict','Path=/','Secure'])assert.ok(form.headers['set-cookie'].includes(flag))
 const withCookie={headers:{...req.headers,cookie:req.headers.cookie+'; '+form.headers['set-cookie'].split(';')[0]}}
 assert.equal(security.verify(withCookie,'/admin/companies',form.token),true)
 assert.equal(security.verify(req,'/admin/companies',form.token),false)
 assert.equal(security.verify(withCookie,'/company/activate',form.token),false)
 assert.equal(security.verify({headers:{...withCookie.headers,host:'other.example'}},'/admin/companies',form.token),false)
 assert.equal(security.verify({headers:{...withCookie.headers,cookie:withCookie.headers.cookie.replace('test-session','other-session')}},'/admin/companies',form.token),false)
 assert.equal(security.verify(withCookie,'/admin/companies',form.token.slice(0,-1)+'z'),false)
 time+=3600001;assert.equal(security.verify(withCookie,'/admin/companies',form.token),false)
})
