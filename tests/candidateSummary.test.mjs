import {test} from 'node:test'
import assert from 'node:assert/strict'
import {summarizeAnswers,stageEntries} from '../src/candidateSummary.ts'
test('averages exclude missing evidence and keep requirements on their own scale',()=>{
 const entries=[{id:'a',title:'Communication',assessment:false},{id:'b',title:'Communication',assessment:false},{id:'c',title:'Detail',assessment:false},{id:'d',title:'Detail',assessment:false},{id:'r1',title:'Availability',assessment:true},{id:'r2',title:'Experience',assessment:true},{id:'r3',title:'Other',assessment:true}]
 const s=summarizeAnswers(entries,{a:{rating:'5'},b:{rating:'3'},c:{rating:'Not observed'},r1:{requirement:'3 — Meets role requirements'},r2:{requirement:'0 — Does not meet role requirements'},r3:{requirement:'Pending — Insufficient evidence'}})
 assert.equal(s.average,4);assert.equal(s.scored,2);assert.equal(s.competencyTotal,4);assert.equal(s.notObserved,1)
 assert.deepEqual([s.met,s.unmet,s.pending,s.requirementPoints,s.requirementMaximum],[1,1,1,3,6]);assert.equal(s.groups[1].average,null)
 assert.equal(summarizeAnswers(entries,{}).average,null)
})
test('reference competency requirements are counted independently of competency ratings',()=>{
 const s=summarizeAnswers([{id:'a',title:'Communication',assessment:false}],{a:{rating:'4',requirement:'Pending — Insufficient evidence'}},true)
 assert.equal(s.average,4);assert.equal(s.pending,1);assert.equal(s.requirementMaximum,0)
})
test('legacy reference questions belong only to an unambiguous reference stage',()=>{
 const kit={stages:[{id:'r',name:'Reference check'}],backgroundItems:[],referenceItems:[{id:'legacy',competencyId:'c'}],competencies:[{id:'c',name:'Detail'}],items:[]}
 assert.equal(stageEntries(kit,kit.stages[0]).length,1)
 kit.stages.push({id:'r2',name:'Reference check'})
 assert.equal(stageEntries(kit,kit.stages[0]).length,0)
})
