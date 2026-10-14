import type { Draft, Stage } from './App'
export type Answer = { notes?: string; requirement?: string; rating?: string }
export type Reference = { id: string; name: string; relationship: string; organization: string; period: string; date: string; checker: string; permission: boolean; answers: Record<string,Answer>; summary: string }
export type StepReview = { summary?: string; strengths?: string; concerns?: string; support?: string; nextSteps?: string }
export type Candidate = { name: string; kit: Draft; answers: Record<string,Answer>; references: Record<string,Reference[]>; interviews: Record<string,{interviewer?:string;date?:string}>; summary: string; stepReviews?: Record<string,StepReview> }
export const isReference = (stage: Stage) => stage.template === 'Reference check' || stage.name === 'Reference check'
export function summarizeAnswers(entries: {id:string;title:string;assessment:boolean}[], answers:Record<string,Answer>, reference=false) {
  const rows=entries.map(entry=>({...entry,answer:answers[entry.id] || {}}))
  const competency=rows.filter(r=>!r.assessment)
  const scored=competency.filter(r=>/^[1-5]$/.test(r.answer.rating || ''))
  const requirements=rows.filter(r=>r.assessment || reference)
  const met=requirements.filter(r=>r.answer.requirement==='3 — Meets role requirements').length
  const unmet=requirements.filter(r=>r.answer.requirement==='0 — Does not meet role requirements').length
  const pending=requirements.filter(r=>r.answer.requirement==='Pending — Insufficient evidence').length
  const groups=[...new Set(competency.map(r=>r.title))].map(title=>{
    const matching=competency.filter(r=>r.title===title), rated=matching.filter(r=>/^[1-5]$/.test(r.answer.rating || ''))
    return {title,total:matching.length,scored:rated.length,average:rated.length?rated.reduce((sum,r)=>sum+Number(r.answer.rating),0)/rated.length:null}
  })
  return {rows,groups,scored:scored.length,competencyTotal:competency.length,average:scored.length?scored.reduce((sum,r)=>sum+Number(r.answer.rating),0)/scored.length:null,requirementsTotal:requirements.length,met,unmet,pending,unassessed:requirements.length-met-unmet-pending,requirementPoints:met*3,requirementMaximum:(met+unmet)*3,notes:rows.filter(r=>r.answer.notes?.trim()).length,notObserved:competency.filter(r=>r.answer.rating==='Not observed').length}
}
export function stageEntries(kit:Draft,stage:Stage) {
  const background=(kit.backgroundItems || []).filter(q=>q.stageId===stage.id).map(q=>({id:q.id,title:q.title,assessment:true}))
  const items=isReference(stage)?kit.referenceItems.filter(q=>q.stageId===stage.id || (!q.stageId && kit.stages.filter(isReference).length===1)):kit.items.filter(q=>kit.competencies.find(c=>c.id===q.competencyId)?.stageId===stage.id)
  return [...background,...items.map(q=>({id:q.id,title:kit.competencies.find(c=>c.id===q.competencyId)?.name || 'Competency',assessment:false}))]
}
