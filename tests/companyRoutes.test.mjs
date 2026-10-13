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
 server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;await companyRoutes(req,res,path,{store,enabled:true,candidateReady,send:(r,s,b,h)=>r.writeHead(s,h).end(b),body:async(req,max)=>{let b='';for await(const c of req){b+=c;if(b.length>max)throw Error('Large')}return b},originOkay:req=>req.headers.origin===base,rate:()=>true,validSession:()=>false})})
 server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`
})
after(async()=>{await new Promise(r=>server.close(r));await db.close()})
const post=(path,data,cookie='')=>fetch(base+path,{method:'POST',redirect:'manual',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify(data)})
const login=async email=>{const response=await fetch(base+'/company/sign-in',{method:'POST',redirect:'manual',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password})});assert.equal(response.status,303);assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return response.headers.get('set-cookie').split(';')[0]}
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
