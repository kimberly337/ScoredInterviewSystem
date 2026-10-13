import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { CompanyStore } from '../companyStore.mjs'
let db, store, a, b, companyA, companyB, kitA, candidateA
const password='Test-only-private-password-48!'
const kit={role:'Service Coordinator',stages:[{id:'screen',name:'Screening'}],items:[{id:'q1',question:'Describe your work.'}],approved:true}
before(async()=>{
 db=new PGlite();store=new CompanyStore(db,randomBytes(32).toString('base64'));await store.init()
 companyA=await store.createCompany('Test Company A','admin-a@example.test');companyB=await store.createCompany('Test Company B','admin-b@example.test')
 await store.activate(companyA.token,password);await store.activate(companyB.token,password)
 a=await store.session(await store.login('admin-a@example.test',password));b=await store.session(await store.login('admin-b@example.test',password))
})
after(async()=>await db.close())
test('invitation-only accounts hash passwords and reject reuse, expiry and wrong passwords',async()=>{
 assert.equal(a.company_id,companyA.id);assert.equal(b.company_id,companyB.id)
 const raw=(await db.query('SELECT password_hash FROM workspace_users WHERE id=$1',[a.id])).rows[0].password_hash
 assert.ok(!raw.includes(password));assert.match(raw,/^[a-f0-9]{32}\.[a-f0-9]{128}$/)
 await assert.rejects(store.activate(companyA.token,password),e=>e.status===400)
 await assert.rejects(store.login('admin-a@example.test','incorrect'),e=>e.status===401)
 const invite=await store.invite(companyA.id,'expired@example.test');await db.query("UPDATE workspace_invites SET expires_at=now()-interval '1 minute' WHERE user_id=$1",[invite.userId])
 await assert.rejects(store.activate(invite.token,password),e=>e.status===400)
})
test('company records are encrypted and cannot be read or overwritten by another company',async()=>{
 kitA=await store.save(a,{id:randomUUID(),kind:'kit',revision:0,data:kit})
 candidateA=await store.save(a,{id:randomUUID(),kind:'candidate',parentId:kitA.id,revision:0,data:{name:'Candidate confidential',kit,answers:{q1:{notes:'Private evidence note',rating:'3'}}}})
 assert.equal((await store.get(a,candidateA.id)).data.answers.q1.notes,'Private evidence note')
 assert.equal((await store.list(b,'candidate')).length,0)
 await assert.rejects(store.get(b,candidateA.id),e=>e.status===404)
 await assert.rejects(store.save(b,{...candidateA,data:{...candidateA.data,name:'Overwrite'}}),e=>e.status===404)
 await assert.rejects(store.save(b,{id:randomUUID(),kind:'candidate',parentId:kitA.id,revision:0,data:candidateA.data}),e=>e.status===404)
 const payload=(await db.query('SELECT payload FROM workspace_records WHERE id=$1',[candidateA.id])).rows[0].payload
 assert.ok(!payload.includes('Private evidence')&&!payload.includes('Candidate confidential'))
 assert.throws(()=>store.decrypt(payload,b.company_id))
})
test('saved scorecards persist while snapshots stay fixed and competing edits cannot overwrite',async()=>{
 const saved=await store.save(a,{...candidateA,data:{...candidateA.data,kit:{...kit,role:'Tampered criteria'},answers:{q1:{notes:'Updated evidence',rating:'5'}}}})
 assert.equal(saved.data.kit.role,'Service Coordinator');assert.equal(saved.revision,2)
 await assert.rejects(store.save(a,{...candidateA,data:{...candidateA.data,answers:{}}}),e=>e.status===409)
 const independentStore=new CompanyStore(db,store.key.toString('base64'));await independentStore.init()
 assert.equal((await independentStore.get(a,candidateA.id)).data.answers.q1.notes,'Updated evidence')
 candidateA=saved
})
test('unapproved kits cannot create candidates',async()=>{
 const draft=await store.save(a,{id:randomUUID(),kind:'kit',revision:0,data:{...kit,approved:false}})
 await assert.rejects(store.save(a,{id:randomUUID(),kind:'candidate',parentId:draft.id,revision:0,data:{name:'Test',kit}}),e=>e.status===400)
})
test('company administrators control invites, removal and recoverable archival within their own company',async()=>{
 const invite=await store.invite(companyA.id,'member@example.test');await store.activate(invite.token,password)
 const token=await store.login('member@example.test',password);const member=await store.session(token)
 await assert.rejects(store.members(member),e=>e.status===403)
 await assert.rejects(store.disable(member,a.id),e=>e.status===403)
 await assert.rejects(store.archive(member,candidateA.id),e=>e.status===403)
 await assert.rejects(store.disable(b,member.id),e=>e.status===404)
 await assert.rejects(store.archive(b,candidateA.id),e=>e.status===404)
 await store.disable(a,member.id);assert.equal(await store.session(token),null)
 await store.archive(a,candidateA.id);await assert.rejects(store.get(a,candidateA.id),e=>e.status===404)
 assert.equal((await store.list(a,'candidate',true)).length,1)
 await store.archive(a,candidateA.id,true);assert.equal((await store.get(a,candidateA.id)).data.name,'Candidate confidential')
})
test('company storage fails closed when encryption or database is missing',async()=>{
 await assert.rejects(new CompanyStore(db,'').init(),e=>e.status===503)
 await assert.rejects(new CompanyStore(null,store.key.toString('base64')).init(),e=>e.status===503)
})

test('account recovery stays company-scoped and revokes previous sessions after activation',async()=>{
 await assert.rejects(store.recovery(b,a.id),e=>e.status===404)
 await assert.rejects(store.recovery({...a,role:'member'},a.id),e=>e.status===403)
 const old=await store.login('admin-a@example.test',password)
 const token=await store.recovery(a,a.id)
 await store.activate(token,'Changed-test-password-92!')
 assert.equal(await store.session(old),null)
 await assert.rejects(store.login('admin-a@example.test',password),e=>e.status===401)
 assert.ok(await store.session(await store.login('admin-a@example.test','Changed-test-password-92!')))
})
