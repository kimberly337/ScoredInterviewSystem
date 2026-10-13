import { before,after,test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { randomBytes,randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { CompanyStore } from '../companyStore.mjs'
import { companyRoutes } from '../companyRoutes.mjs'
let db,store,server,base,cookie,otherCookie,opening
let candidateReady=true
const password='Only-local-test-password-73!'
before(async()=>{
 db=new PGlite();store=new CompanyStore(db,randomBytes(32).toString('base64'))
 for(const [email,name] of [['a@example.test','A'],['b@example.test','B']]){const invite=await store.createCompany(name,email);await store.activate(invite.token,password)}
 server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;await companyRoutes(req,res,path,{store,enabled:true,candidateReady,send:(r,s,b,h)=>r.writeHead(s,h).end(b),body:async(req,max)=>{let b='';for await(const c of req){b+=c;if(b.length>max)throw Error('Large')}return b},originOkay:req=>req.headers.origin===base,rate:()=>true,validSession:req=>(req.headers.cookie || "").split(/;\s*/).includes("ef_admin=operator-test")})})
 server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`
})
after(async()=>{await new Promise(r=>server.close(r));await db.close()})
const post=(path,data,cookie='')=>fetch(base+path,{method:'POST',redirect:'manual',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify(data)})
const readForm=async(path,extraCookie='')=>{
 const response=await fetch(base+path,{headers:{cookie:extraCookie}})
 const html=await response.text(),csrf=html.match(/name="csrf" value="([^"]+)"/)?.[1]
 assert.ok(csrf);const nonce=response.headers.get('set-cookie').split(';')[0]
 return {csrf,cookie:[extraCookie,nonce].filter(Boolean).join('; ')}
}
const login=async email=>{const form=await readForm('/company/sign-in');const response=await fetch(base+'/company/sign-in',{method:'POST',redirect:'manual',headers:{origin:base,cookie:form.cookie,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password,csrf:form.csrf})});assert.equal(response.status,303);assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return response.headers.get('set-cookie').split(';')[0]}

test('HTTP records require a company session; admin cookie alone grants no candidate access',async()=>{
 assert.equal((await fetch(base+'/api/company/records?kind=candidate')).status,401)
 assert.equal((await fetch(base+'/api/company/records?kind=candidate',{headers:{cookie:'ef_admin=shared-test'}})).status,401)
 cookie=await login('a@example.test');otherCookie=await login('b@example.test')
 const session=await fetch(base+'/api/company/session',{headers:{cookie}});assert.equal((await session.json()).user.company_name,'A')
})
test('HTTP saves survive fresh requests, enforce origin and isolate company records',async()=>{
 const input={id:randomUUID(),kind:'kit',revision:0,data:{role:'Real opening test',stages:[],items:[],approved:false}}
 const unverified=await fetch(base+'/api/company/records',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify(input)});assert.equal(unverified.status,403)
 const response=await post('/api/company/records',input,cookie);assert.equal(response.status,200);opening=(await response.json()).record
 const read=await fetch(base+'/api/company/records/'+opening.id,{headers:{cookie}});assert.equal((await read.json()).record.data.role,'Real opening test')
 assert.equal((await fetch(base+'/api/company/records/'+opening.id,{headers:{cookie:otherCookie}})).status,404)
 const overwrite=await post('/api/company/records',{...opening,data:{...opening.data,role:'Overwrite'}},otherCookie);assert.equal(overwrite.status,409)
})
test('candidate APIs stay closed until recovery readiness is enabled',async()=>{
 candidateReady=false
 const response=await post('/api/company/records',{id:randomUUID(),kind:'candidate',parentId:opening.id,revision:0,data:{name:'Test candidate',kit:opening.data}},cookie)
 assert.equal(response.status,503);assert.match((await response.json()).error,/Backup setup/)
 assert.equal((await fetch(base+'/api/company/records?kind=candidate',{headers:{cookie}})).status,503)
 candidateReady=true
})
test('logout revokes the database session immediately',async()=>{
 assert.equal((await post('/api/company/logout',{},cookie)).status,200)
 assert.equal((await fetch(base+'/api/company/session',{headers:{cookie}})).status,401)
})

test('company setup works without browser origin/referrer headers but rejects missing and forged form tokens',async()=>{
 const form=await readForm('/admin/companies','ef_admin=operator-test')
 const submit=(headers,csrf=form.csrf)=>fetch(base+'/admin/companies',{method:'POST',headers:{cookie:form.cookie,'content-type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({name:'Form verification company',email:'verified-form@example.test',csrf})})
 const missing=await submit({origin:base},'');assert.equal(missing.status,403);assert.match(missing.headers.get('content-type'),/text\/html/);assert.match(await missing.text(),/Open company setup/)
 assert.equal((await submit({origin:'https://unrelated.example'})).status,403)
 assert.equal((await submit({'sec-fetch-site':'cross-site'})).status,403)
 assert.equal((await submit({cookie:form.cookie.replace(/ef_form=[a-f0-9]+/,'ef_form='+'0'.repeat(64))})).status,403)
 const accepted=await submit({});assert.equal(accepted.status,200);assert.match(await accepted.text(),/Form verification company created/)
 assert.equal((await db.query('SELECT name FROM workspace_companies WHERE name=$1',['Form verification company'])).rows.length,1)
 const duplicate=await submit({origin:'null'});assert.equal(duplicate.status,409);assert.match(duplicate.headers.get('content-type'),/text\/html/);assert.match(await duplicate.text(),/already has an account/)
})
test('activation and company sign-in accept valid signed forms with an opaque Origin',async()=>{
 const invitation=await store.createCompany('Activation check','activation-check@example.test')
 const form=await readForm('/company/activate?token='+invitation.token)
 const activated=await fetch(base+'/company/activate',{method:'POST',headers:{origin:'null',cookie:form.cookie,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:invitation.token,password,confirm:password,csrf:form.csrf})})
 assert.equal(activated.status,200);assert.match(await activated.text(),/Account activated/)
 const loginForm=await readForm('/company/sign-in')
 const loggedIn=await fetch(base+'/company/sign-in',{method:'POST',redirect:'manual',headers:{origin:'null',cookie:loginForm.cookie,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:'activation-check@example.test',password,csrf:loginForm.csrf})})
 assert.equal(loggedIn.status,303);assert.match(loggedIn.headers.get('set-cookie'),/ef_company=/)
})
