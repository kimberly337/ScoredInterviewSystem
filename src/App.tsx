import { useEffect, useState } from 'react'
import './App.css'
import { competencyBank } from './competencyBank'
import { recommendStep } from './recommendations'
import { matchRoleCompetencies } from './roleMatching'
import { readJobDescription } from './jobDescriptionFile'
import ReferenceGuide from './ReferenceGuide'
import { reportError } from './errorReporting'
import BackgroundQuestions from './BackgroundQuestions'
import { assessmentPlan, backgroundTemplates, questionTarget, type BackgroundItem } from './questionPlanning'

type Value = { id: string; name: string; behavior: string; concern: string }
type Stage = { id: string; name: string; owner: string; method: string; purpose: string; advance: string; template?: string; questionCount?: number }
type Competency = { id: string; name: string; source: string; evidence: string; stageId: string; included: boolean; bankId?: string; matchText?: string; matchCues?: string[] }
type Item = { id: string; questionKey?: string; competencyId: string; question: string; probe: string; low: string; meets: string; high: string }
type ReferenceItem = { id: string; stageId?: string; questionKey?: string; competencyId: string; question: string; probe: string }
type Draft = { company: string; culture: string; values: Value[]; role: string; description: string; outcomes: string; requirements: string; teachable: string; challenges: string; stages: Stage[]; competencies: Competency[]; items: Item[]; referenceCompetencyIds: string[]; referenceItems: ReferenceItem[]; approved: boolean; backgroundItems?: BackgroundItem[] }
const uid = () => crypto.randomUUID()
const empty = (): Draft => ({ company: '', culture: '', values: [], role: '', description: '', outcomes: '', requirements: '', teachable: '', challenges: '', stages: [], competencies: [], items: [], referenceCompetencyIds: [], referenceItems: [], backgroundItems: [], approved: false })
const pages = ['Welcome', 'Company', 'Role', 'Hiring steps', 'Competencies', 'Interview kit']
const stepOptions = ['Initial/Screening interview', 'Hiring Manager interview', 'Team interview', 'Stakeholder interview', 'Site visit/tour', 'Sr Leader Interview', 'Reference check']
const isReferenceStage = (stage: Stage) => stage.template === 'Reference check' || (!stage.template && stage.name === 'Reference check')
const peoplePartnerExample = (): Draft => {
  const screen = uid(), manager = uid(), exercise = uid(), reference = uid()
  const stages: Stage[] = [
    { id: screen, name: 'Initial/Screening interview', template: 'Initial/Screening interview', owner: 'HR / Talent Acquisition', method: 'Conversation', purpose: 'Confirm relevant experience and scope of employee relations work.', advance: 'Meets the stated minimum qualifications and can explain firsthand HR advisory work.' },
    { id: manager, name: 'Hiring Manager interview', template: 'Hiring Manager interview', owner: 'People Team leader', method: 'Behavioral interview', purpose: 'Explore confidentiality, conflict resolution, and leader coaching.', advance: 'Review specific examples against the role criteria.' },
    { id: exercise, name: 'HR case exercise', template: 'custom', owner: 'People Team leader and operations partner', method: 'Practical written task', purpose: 'Observe fact finding, policy judgment, written advice, and workforce analysis.', advance: 'Provides a reasoned plan with documentation and an appropriate escalation point.' },
    { id: reference, name: 'Reference check', template: 'Reference check', owner: 'Hiring manager or HR', method: 'Structured phone call', purpose: 'Verify job-related behaviors through observed examples.', advance: 'Review reference evidence alongside the interview scorecards.' },
  ]
  const definitions = [
    { name: 'Relevant HR advisory experience', evidence: 'Describes at least three years of progressive HR work including firsthand employee relations, investigation, and performance management responsibilities.', stageId: screen, source: 'Added for example', question: 'Walk me through your HR roles over the past three years. Which employee relations, investigation, and performance matters did you personally handle, and what was your level of responsibility?', low: 'Cannot describe the required scope or has not directly handled the core HR matters listed.', meets: 'Describes at least three years of progressive HR work and direct involvement in employee relations, investigations, and performance management.', high: 'Meets the experience threshold and explains independent ownership, complexity, and outcomes across these areas.' },
    { name: 'Confidentiality and discretion', evidence: 'Handles sensitive information carefully and shares it only with people who need it for the work.', stageId: manager, source: 'Role description', question: 'Tell me about a time a leader wanted details from a sensitive employee matter. How did you decide what could be shared, with whom, and what did you say?', low: 'Discloses sensitive details beyond the work need or cannot explain who needed access.', meets: 'Explains a specific need-to-know decision, appropriate communication, and care with records or access.', high: 'Explains a nuanced boundary, redirects the leader constructively, and documents or escalates appropriately.' },
    { name: 'Conflict resolution', evidence: 'Clarifies differing views and helps people agree on a workable next step.', stageId: manager, source: 'Role description', question: 'Describe a workplace conflict where the parties gave different accounts. How did you clarify the facts, advise the leader, and follow through?', low: 'Takes a side before checking accounts or leaves the leader without a workable next step.', meets: 'Clarifies differing accounts, identifies the leader’s role, and follows through on an appropriate plan.', high: 'Shows careful fact finding, coaches the leader through the conflict, and checks whether the resolution held.' },
    { name: 'Leader coaching', evidence: 'Uses questions and specific feedback to help an operational leader own a fair, workable people decision.', stageId: manager, source: 'Added for example', question: 'Tell me about a manager who wanted HR to handle a difficult performance conversation for them. How did you coach that leader to own the next step?', low: 'Takes over the manager’s responsibility or offers only general advice.', meets: 'Uses questions and specific feedback to prepare the leader for the conversation and agrees on follow-up.', high: 'Builds the leader’s capability, adapts coaching to resistance, and confirms the leader carried out the plan.' },
    { name: 'Policy application', evidence: 'Checks the applicable policy, recognizes when it does not answer the situation, and seeks review when needed.', stageId: exercise, source: 'Role description', question: 'Case: A supervisor wants corrective action after repeated missed handoffs, but the accounts conflict and you have only part of the policy. What would you check before advising the supervisor?', low: 'Recommends corrective action from incomplete accounts or assumes a policy provision without checking it.', meets: 'Identifies applicable policy, missing facts, consistency checks, and when to seek specialist review.', high: 'Explains a proportionate sequence, policy limits, documentation, and a clear escalation point.' },
    { name: 'Fact finding', evidence: 'Asks open questions, separates observations from assumptions, and checks gaps before reaching a conclusion.', stageId: exercise, source: 'Role description', question: 'Using the same handoff case, outline who you would speak with, what open questions you would ask, and how you would separate facts from assumptions.', low: 'Uses leading questions or treats one account as settled fact.', meets: 'Lists relevant sources and open questions, separates observation from inference, and identifies gaps.', high: 'Prioritizes fair interviews, tests conflicting evidence, and explains how findings would be documented.' },
    { name: 'Written communication', evidence: 'Writes accurate messages that state the action and audience clearly.', stageId: exercise, source: 'Role description', question: 'Write a short message to the supervisor explaining your immediate next steps and what information you need. Keep sensitive details limited to those needed for the work.', low: 'Message is vague, overdiscloses details, or promises a decision before facts are checked.', meets: 'Clear, concise note states immediate steps, owner, timing, and information needed without unnecessary details.', high: 'Tailors the message to the leader, sets a useful boundary, and leaves an accurate written record.' },
    { name: 'Workforce data to action', evidence: 'Interprets a workforce trend, checks what the data cannot show, and recommends a practical action to a leader.', stageId: exercise, source: 'Added for example', question: 'A unit’s turnover rate rose from 12% to 21% over two quarters. What would you check before drawing a conclusion, and what first action would you recommend to the leader?', low: 'Assumes the increase proves a cause or recommends action without validating the data.', meets: 'Checks definitions, group size, timing, and comparison; proposes a practical next step based on what is known.', high: 'Tests multiple plausible causes, names uncertainty, and proposes an action with a measure to review its effect.' },
  ]
  const competencies: Competency[] = definitions.map(c => ({ id: uid(), name: c.name, evidence: c.evidence, stageId: c.stageId, source: c.source, included: true }))
  const items: Item[] = definitions.map((c, i) => ({ id: uid(), competencyId: competencies[i].id, question: c.question, probe: c.stageId === exercise ? 'What information is missing? What would you document or escalate?' : 'What was your own part? What happened next? What would you do differently?', low: c.low, meets: c.meets, high: c.high }))
  const referenceNames = ['Conflict resolution', 'Fact finding', 'Leader coaching']
  const referenceQuestions = [
    'When this person helped resolve a disagreement between coworkers or a leader and teammate, what did you observe them do? What happened afterward?',
    'Can you recall a situation where this person had to investigate an uncertain people issue? How did they gather and verify information before advising a decision?',
    'How did you see this person coach a manager through a performance or employee relations matter? What changed in the manager’s approach?',
  ]
  const referenceCompetencyIds = referenceNames.map(name => competencies.find(c => c.name === name)!.id)
  const referenceItems: ReferenceItem[] = referenceCompetencyIds.map((competencyId, i) => ({ id: uid(), competencyId, question: referenceQuestions[i], probe: 'How directly did you observe this? How often? What context would help us understand the example?' }))
  return {
    company: 'Healthcare revenue services company (example)',
    culture: 'The supplied posting describes a results-driven, collaborative environment with continuous learning. Specific company values have not been verified for this example.',
    values: [], role: 'People Partner',
    description: 'Example based on the supplied People Partner posting: advise leaders on employee relations, investigations, performance management, organizational change, engagement, and workforce planning. Apply policies consistently, protect confidential information, use data to recommend action, and coach leaders to manage their teams.',
    outcomes: 'Coach leaders through performance and employee relations issues; conduct fair fact finding; use workforce data to recommend practical actions.',
    requirements: 'Progressive HR experience, employee relations, investigations, performance management, employment law knowledge, consultation, confidentiality, and judgment.',
    teachable: 'Organization-specific systems, policies, revenue cycle context, and reporting formats.',
    challenges: 'A leader asks for immediate corrective action while accounts conflict and relevant policy information is incomplete.',
    stages: stages.map(stage => ({ ...stage, questionCount: isReferenceStage(stage) ? referenceItems.length : items.filter(item => competencies.some(c => c.id === item.competencyId && c.stageId === stage.id)).length })), competencies, items, referenceCompetencyIds, referenceItems, backgroundItems: stages.flatMap(stage => backgroundTemplates(stage).map(([title, question, probe], index) => ({ id: `${stage.id}:background:${index}`, stageId: stage.id, title, question, probe }))), approved: false,
  }
}
function App() {
  const [d, setD] = useState<Draft>(() => { try { const saved = JSON.parse(localStorage.getItem('efactor-draft') || '{}'); return { ...empty(), ...saved, approved: saved.backgroundItems ? saved.approved : false } } catch { return empty() } })
  const [page, setPage] = useState(0)
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [scores, setScores] = useState<Record<string, string>>({})
  const [bankOpen, setBankOpen] = useState(false)
  const [bankQuery, setBankQuery] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  useEffect(() => { localStorage.setItem('efactor-draft', JSON.stringify(d)) }, [d])
  const change = (patch: Partial<Draft>) => setD(old => ({ ...old, ...patch, items: patch.items ?? [], referenceItems: patch.referenceItems ?? [], backgroundItems: patch.backgroundItems ?? [], approved: false }))
  const editValue = (id: string, patch: Partial<Value>) => change({ values: d.values.map(v => v.id === id ? { ...v, ...patch } : v) })
  const editStage = (id: string, patch: Partial<Stage>) => change({ stages: d.stages.map(s => s.id === id ? { ...s, ...patch } : s), ...(Object.keys(patch).length === 1 && 'questionCount' in patch ? { items: d.items, referenceItems: d.referenceItems, backgroundItems: d.backgroundItems } : {}) })
  const editComp = (id: string, patch: Partial<Competency>) => change({ competencies: d.competencies.map(c => c.id === id ? { ...c, ...patch } : c) })
  const editBackground = (id: string, patch: Partial<BackgroundItem>) => change({ backgroundItems: (d.backgroundItems || []).map(q => q.id === id ? { ...q, ...patch } : q), items: d.items, referenceItems: d.referenceItems })
  const editItem = (id: string, patch: Partial<Item>) => change({ items: d.items.map(q => q.id === id ? { ...q, ...patch } : q), referenceItems: d.referenceItems, backgroundItems: d.backgroundItems })
  const editReferenceItem = (id: string, patch: Partial<ReferenceItem>) => change({ referenceItems: d.referenceItems.map(q => q.id === id ? { ...q, ...patch } : q), items: d.items, backgroundItems: d.backgroundItems })
  const importDescription = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const description = await readJobDescription(file)
      change({ description })
      setUploadName(file.name)
      setMessage(`Text from ${file.name} is ready below. Review it before suggesting competencies.`)
    } catch (error) {
      reportError('job_description_import', error)
      setMessage(error instanceof Error ? error.message : 'Could not read this file. Paste the job description instead.')
    } finally {
      setUploading(false)
    }
  }
  const propose = () => {
    const source = [d.description, d.outcomes, d.requirements, d.challenges].join(' ')
    const kept = d.competencies.filter(c => c.source !== 'Role description' && c.source !== 'Company value')
    const role = matchRoleCompetencies(source).map(match => ({
      id: uid(), bankId: match.entry.id, name: match.entry.name, evidence: match.entry.evidence,
      source: 'Role description', matchText: match.excerpt, matchCues: match.cues,
      stageId: '', included: true,
    }))
    const values = d.values.filter(v => v.name.trim()).map(v => ({ id: uid(), name: v.name, evidence: v.behavior, source: 'Company value', stageId: '', included: true }))
    const seen = new Set(kept.map(c => c.name.trim().toLowerCase()))
    const suggestions = [...role, ...values].filter(c => {
      const key = c.name.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    change({ competencies: [...kept, ...suggestions], referenceCompetencyIds: d.referenceCompetencyIds.filter(id => kept.some(c => c.id === id)), items: [] })
    setMessage(role.length ? 'Possible matches are ready. Review the matched text and behavior before assigning a step.' : 'No clear bank matches found in the role text. Browse the bank or add the job-specific behaviors yourself.')
  }
  const addFromBank = (entry: (typeof competencyBank)[number]) => {
    if (d.competencies.some(c => c.bankId === entry.id || c.name.trim().toLowerCase() === entry.name.toLowerCase())) return
    change({ competencies: [...d.competencies, { id: uid(), bankId: entry.id, name: entry.name, evidence: entry.evidence, source: 'Competency bank', stageId: '', included: true }] })
    setMessage(`${entry.name} added. Edit the behavior and assign it to a hiring step.`)
  }
  const aiDraft = async (mode: 'suggest' | 'tailor') => {
    if (!d.role.trim() || !d.description.trim()) { setMessage('Add a role title and job description first.'); return }
    const selected = d.competencies.filter(c => c.included)
    if (mode === 'tailor' && (!selected.length || selected.some(c => !c.stageId))) { setMessage('Include competencies and assign each one to a hiring step first.'); return }
    let plan: ReturnType<typeof assessmentPlan> = []
    if (mode === 'tailor') { try { plan = assessmentPlan(d.stages.filter(s => !isReferenceStage(s)), selected) } catch (error) { setMessage((error as Error).message); return } }
    if (plan.length > 48) { setMessage('AI tailoring supports up to 48 competency questions per request. Reduce the counts or edit the draft questions directly.'); return }
    setAiBusy(true)
    setMessage('Drafting with OpenAI. Review every suggestion before using it.')
    try {
      const response = await fetch('/api/ai/draft', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, role: d.role, description: d.description, culture: d.culture, outcomes: d.outcomes, requirements: d.requirements, challenges: d.challenges, values: d.values, stages: d.stages.filter(s => !isReferenceStage(s)), competencies: mode === 'tailor' ? selected : [], questionPlan: plan }) })
      const result = await response.json()
      if (!response.ok) { setMessage(result.error || 'AI drafting could not finish.'); return }
      if (mode === 'suggest') {
        const seen = new Set(d.competencies.map(c => c.name.trim().toLowerCase()))
        const additions: Competency[] = (result.suggestions as {name:string;evidence:string;reason:string;stageId:string}[]).filter(s => { const key=s.name.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true }).map(s => ({ id: uid(), name: s.name, evidence: s.evidence, matchText: s.reason, source: 'AI suggestion', stageId: s.stageId, included: true }))
        change({ competencies: [...d.competencies, ...additions], referenceCompetencyIds: d.referenceCompetencyIds })
        setMessage(`${additions.length} AI suggestions added. Check each behavior, reason, and hiring step.`)
      } else {
        const prior = new Map(d.items.map(item => [item.questionKey, item]))
        const items: Item[] = (result.items as Item[]).map(item => ({ ...item, id: prior.get(item.questionKey)?.id || uid() }))
        change({ items, referenceItems: d.referenceItems, backgroundItems: buildBackground() })
        setMessage('AI questions and scoring anchors drafted. Edit them before approving the kit.')
      }
    } catch (error) {
      reportError('ai_draft', error)
      setMessage('AI drafting could not connect. Your current draft is safe.')
    } finally { setAiBusy(false) }
  }
  const buildBackground = () => d.stages.flatMap(stage => backgroundTemplates(stage).map(([title, question, probe], index) => {
    const id = `${stage.id}:background:${index}`
    return d.backgroundItems?.find(item => item.id === id) || { id, stageId: stage.id, title, question, probe }
  }))
  const makeKit = () => {
    const selected = d.competencies.filter(c => c.included)
    if (!selected.length || selected.some(c => !c.name.trim() || !c.evidence.trim() || !d.stages.some(s => s.id === c.stageId && !isReferenceStage(s)))) { setMessage('Include complete competencies and assign each one to an interview or work sample step.'); return }
    let plan: ReturnType<typeof assessmentPlan>, referencePlan: ReturnType<typeof assessmentPlan>
    try {
      plan = assessmentPlan(d.stages.filter(s => !isReferenceStage(s)), selected)
      referencePlan = d.stages.filter(isReferenceStage).flatMap(stage => assessmentPlan([stage], selected.filter(c => d.referenceCompetencyIds.includes(c.id)).map(c => ({ ...c, stageId: stage.id }))))
    } catch (error) { setMessage((error as Error).message); return }
    const prior = new Map(d.items.map(item => [item.questionKey, item]))
    const priorReference = new Map(d.referenceItems.map(item => [item.questionKey, item]))
    change({ backgroundItems: buildBackground(), referenceItems: referencePlan.map(slot => {
      const c = selected.find(c => c.id === slot.competencyId)!
      const legacy = slot.variant === 0 ? d.referenceItems.find(item => !item.questionKey && item.competencyId === c.id) : undefined
      return priorReference.get(slot.questionKey) || (legacy ? { ...legacy, ...slot } : { id: uid(), ...slot,
        question: slot.variant ? `Describe another situation that showed this person's ${c.name.toLowerCase()}. What support did they need, and what did you observe afterward?` : `Can you describe a specific time you observed this person demonstrate ${c.name.toLowerCase()}? What did they do, and what was the result?`,
        probe: 'How directly did you observe this? How often? What context would help us understand the example?',
      })
    }), items: plan.map(slot => {
      const c = selected.find(c => c.id === slot.competencyId)!
      const legacy = slot.variant === 0 ? d.items.find(item => !item.questionKey && item.competencyId === c.id) : undefined
      return prior.get(slot.questionKey) || (legacy ? { ...legacy, ...slot } : { id: uid(), ...slot,
        question: slot.variant ? `Describe a different challenge involving ${c.name.toLowerCase()}. What changed, how did you respond, and what did you learn?` : /work|sample|practical|task/i.test(d.stages.find(s => s.id === c.stageId)?.method || '') ? `Show how you would demonstrate ${c.name.toLowerCase()} in this task. What did you notice and do?` : `Tell me about a specific time you demonstrated ${c.name.toLowerCase()} at work. What happened, what did you do, and what was the result?`,
        probe: 'What was your own part? What did you notice? What would you do differently?',
        low: `Little relevant evidence, or actions worked against this behavior: ${c.evidence}`,
        meets: `A specific example shows this behavior: ${c.evidence}`,
        high: `A detailed example shows this behavior independently and explains its effect: ${c.evidence}`,
      })
    }) })
    setPage(5); setMessage('Draft generated to the selected question counts. Review every question before approval.')
  }
  const countIssues = d.stages.flatMap(stage => {
    const assessment = isReferenceStage(stage) ? d.referenceItems.filter(item => item.stageId === stage.id || (!item.stageId && d.stages.filter(isReferenceStage).length === 1)) : d.items.filter(item => d.competencies.some(c => c.id === item.competencyId && c.included && c.stageId === stage.id))
    const background = (d.backgroundItems || []).filter(item => item.stageId === stage.id)
    if (background.some(item => item.question.includes('[enter '))) return [`${stage.name}: complete the work arrangement and schedule question with the stated role requirements before approval.`]
    return assessment.length !== questionTarget(stage) || background.length !== backgroundTemplates(stage).length || [...assessment, ...background].some(item => !item.question.trim()) ? [`${stage.name || 'Unnamed step'}: ${assessment.length} of ${questionTarget(stage)} competency questions; ${background.length} of ${backgroundTemplates(stage).length} background questions.`] : []
  })
  const example = () => {
    setD({ company: 'Example organization', culture: 'A small production team that checks work carefully and communicates problems early.', values: [{ id: uid(), name: 'Responsibility', behavior: 'Names a problem, takes an appropriate next step, and keeps affected teammates informed.', concern: 'Hides a quality issue or shifts blame.' }], role: 'Screen Printing Specialist', description: 'Prepare and run print jobs. Check color, placement, and registration against an approved sample. Use equipment safely and work with the team to meet deadlines.', outcomes: 'Produce accurate work and catch print issues before a run continues.', requirements: 'Attention to detail and ability to follow a production process.', teachable: 'Specific equipment and scheduling software.', challenges: 'A print drifts from the approved sample during a production run.', stages: [{ id: uid(), name: 'Initial/Screening interview', template: 'Initial/Screening interview', owner: 'Hiring manager', method: 'Conversation', purpose: 'Explore past work and quality concerns.', advance: 'Review the evidence against each criterion.' }, { id: uid(), name: 'Work sample', template: 'custom', owner: 'Production lead', method: 'Practical task', purpose: 'Observe a representative quality check.', advance: 'Review observed work against scoring anchors.' }], competencies: [], items: [], referenceCompetencyIds: [], referenceItems: [], approved: false })
    setPage(1); setMessage('Anonymous example loaded. Its steps are illustrative and editable.')
  }
  const loadPeoplePartner = () => {
    setD(peoplePartnerExample())
    setNotes({}); setScores({}); setUploadName('')
    setPage(5)
    setMessage('People Partner example loaded. Review its questions and scoring anchors before use.')
  }
  const field = (label: string, key: keyof Pick<Draft, 'company'|'culture'|'role'|'description'|'outcomes'|'requirements'|'teachable'|'challenges'>, multi = false, hint = '') => <label>{label}{multi ? <textarea value={d[key]} placeholder={hint} onChange={e => change({ [key]: e.target.value })} /> : <input value={d[key]} placeholder={hint} onChange={e => change({ [key]: e.target.value })} />}</label>
  return <div className="app"><aside className="side"><div className="brand"><img src="/efactor-logo.png" alt="E Factor Leadership"/><p>HR That Works for You.</p></div><p className="side-label">INTERVIEW SYSTEM</p><nav>{pages.map((name, i) => <button key={name} className={page === i ? 'current' : ''} onClick={() => { setPage(i); setMessage('') }}><span>{i ? String(i).padStart(2, '0') : '⌂'}</span>{name}</button>)}</nav><div className="side-foot">● &nbsp; Draft saved in this browser<small>Prototype workspace</small></div></aside><div className="workspace"><header><span>INTERVIEW DESIGN STUDIO</span><span>{d.company || 'New company'}</span></header><div className="prototype-banner">Prototype: setup is stored only in this browser. Use sample company details and no real candidate information.</div><main><div className="print-brand"><img src="/efactor-logo.png" alt="E Factor Leadership"/><div><span>HR That Works for You.</span><strong>{d.company || "Interview kit"}</strong><span>{d.role || "Role not named"}</span></div></div><div className="eyebrow">{page ? `SETUP / ${String(page).padStart(2, '0')} OF 05` : 'A BETTER WAY TO INTERVIEW'}</div>
    {page === 0 && <><h1>Build interviews around<br/><em>what matters.</em></h1><p className="lead">Turn company values, the work of a real role, and your own hiring process into useful questions and consistent scoring guidance.</p><div className="actions"><button className="primary" onClick={() => setPage(1)}>Start an interview kit →</button><button className="link" onClick={example}>Explore a screen printing example</button></div><section className="card sample-callout"><div><h2>People Partner example</h2><p>See the hiring steps, tailored questions, scoring anchors, and reference check built from the posting you shared.</p><small>Loading an example replaces the current browser draft.</small></div><button className="secondary" onClick={loadPeoplePartner}>Open People Partner example</button></section><div className="overview">{[['01','Describe the company','Define values through behavior people can observe.'],['02','Define the role','Review proposed competencies drawn from the work.'],['03','Shape the process','Add hiring steps, then approve the interview kit.']].map(x => <div key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div></>}
    {page === 1 && <><h1>Start with the <em>company.</em></h1><p className="lead">Describe how people work here. Give examples that a manager could observe.</p><section className="card">{field('Company name','company')}{field('What is the work environment like?','culture',true,'Describe the team and how people work together.')}</section><div className="section-head"><div><h2>Values in action</h2><p>Give each value a behavior and an example of concern.</p></div><button className="secondary" onClick={() => change({ values: [...d.values, { id: uid(), name: '', behavior: '', concern: '' }] })}>+ Add value</button></div>{d.values.map((v,i) => <section className="card" key={v.id}><div className="card-head"><h3>Value {i+1}</h3><button className="link" onClick={() => change({ values: d.values.filter(x => x.id !== v.id) })}>Remove</button></div><label>Value name<input value={v.name} onChange={e => editValue(v.id,{name:e.target.value})}/></label><label>What would a manager see someone do?<textarea value={v.behavior} onChange={e => editValue(v.id,{behavior:e.target.value})}/></label><label>What behavior would concern you?<textarea value={v.concern} onChange={e => editValue(v.id,{concern:e.target.value})}/></label></section>)}</>}
    {page === 2 && <>
      <h1>Define the <em>role.</em></h1>
      <p className="lead">Upload a job description or paste its text, then add what success and challenge look like in practice.</p>
      <section className="card">
        {field('Role title','role',false,'e.g. Screen Printing Specialist')}
        <div className="upload-box">
          <label>Upload job description (.docx, searchable .pdf, or .txt)
            <input type="file" accept=".docx,.pdf,.txt" disabled={uploading} onChange={e=>{ const file=e.target.files?.[0]; void importDescription(file); e.target.value='' }}/>
          </label>
          <p>{uploading ? 'Reading the file…' : uploadName ? `Imported ${uploadName}. Review the extracted text below.` : 'The file is read in this browser. Only the extracted text is kept in this draft.'}</p>
        </div>
        {field('Job description','description',true,'Paste the role duties and requirements here.')}
        <div className="columns">{field('What should this person do well in the first few months?','outcomes',true)}{field('What challenges arise in this work?','challenges',true)}{field('What must they bring on day one?','requirements',true)}{field('What can you teach?','teachable',true)}</div>
      </section>
    </>}
    {page === 3 && <>
      <h1>Your process, <em>your way.</em></h1>
      <p className="lead">Choose the hiring steps your company uses, or name a custom step. Add only the steps you need, then set their order. Reference check is an optional final step.</p>
      <div className="section-head"><div><h2>Hiring steps</h2><p>Use the arrows to set the order.</p></div><button className="secondary" onClick={() => change({ stages: [...d.stages,{id:uid(),name:'',template:'',owner:'',method:'',purpose:'',advance:''}] })}>+ Add step</button></div>
      {!d.stages.length && <div className="empty">Add the first point where you assess a candidate.</div>}
      {d.stages.map((s,i) => {
        const selected = s.template ?? (stepOptions.includes(s.name) ? s.name : s.name ? 'custom' : '')
        return <section className="card" key={s.id}>
          <div className="card-head"><h3>{i+1}. {s.name || 'New hiring step'}</h3><div>
            <button className="link" disabled={!i} aria-label={`Move ${s.name || 'step'} up`} onClick={() => { const a=[...d.stages]; [a[i-1],a[i]]=[a[i],a[i-1]]; change({stages:a}) }}>↑</button>
            <button className="link" disabled={i===d.stages.length-1} aria-label={`Move ${s.name || 'step'} down`} onClick={() => { const a=[...d.stages]; [a[i+1],a[i]]=[a[i],a[i+1]]; change({stages:a}) }}>↓</button>
            <button className="link" onClick={() => change({ stages:d.stages.filter(x=>x.id!==s.id), competencies:d.competencies.map(c=>c.stageId===s.id?{...c,stageId:''}:c) })}>Remove</button>
          </div></div>
          <div className="columns">
            <label>Choose a hiring step<select value={selected} onChange={e=>editStage(s.id,e.target.value==='Reference check' ? {template:'Reference check',name:'Reference check',questionCount:3,owner:s.owner||'Hiring manager or HR',method:'Structured phone call',purpose:'Verify job-related behaviors with specific examples.',advance:'Review reference evidence alongside the interview scorecards.'} : {template:e.target.value,name:e.target.value==='custom'?'':e.target.value,questionCount:undefined})}>
              <option value="">Choose a step</option>{stepOptions.map(option=><option key={option} value={option}>{option}</option>)}<option value="custom">Custom step</option>
            </select></label>
            {selected === 'custom' && <label>Custom step name<input value={s.name} placeholder="e.g. Work sample" onChange={e=>editStage(s.id,{name:e.target.value})}/></label>}
            <label>Competency questions<input type="number" min={0} max={12} value={questionTarget(s)} onChange={e=>editStage(s.id,{questionCount:Math.max(0,Math.min(12,Number(e.target.value)))})}/><small>{backgroundTemplates(s).length} background questions + {questionTarget(s)} competency questions = {backgroundTemplates(s).length + questionTarget(s)} core questions. Follow-ups are additional. Use zero for a tour with no assessment.</small></label>
            <label>Who conducts it?<input value={s.owner} onChange={e=>editStage(s.id,{owner:e.target.value})}/></label>
            <label>How does it work?<input value={s.method} placeholder="Conversation, tour, practical task..." onChange={e=>editStage(s.id,{method:e.target.value})}/></label>
            <label>What must you learn?<textarea value={s.purpose} onChange={e=>editStage(s.id,{purpose:e.target.value})}/></label>
          </div>
          <label>What is needed to move forward?<textarea value={s.advance} onChange={e=>editStage(s.id,{advance:e.target.value})}/></label>
          {isReferenceStage(s) && <p className="reference-tip">Choose two or three competencies to verify on the Competencies page. The kit will include a separate call sheet for each reference.</p>}
        </section>
      })}
    </>}
    {page === 4 && <>
      <h1>Choose what to <em>assess.</em></h1>
      <p className="lead">Compare the job description with the competency bank, then review the matched text. You can also choose from the bank or add your own. Check each behavior and suggested hiring step before assigning it.</p>
      <div className="actions">
        <button className="secondary" onClick={propose}>Suggest from role and values</button>
        <button className="secondary" disabled={aiBusy} onClick={() => void aiDraft('suggest')}>{aiBusy ? 'Drafting…' : 'Suggest with AI'}</button>
        <button className="secondary" aria-expanded={bankOpen} aria-controls="competency-bank" onClick={() => setBankOpen(open => !open)}>{bankOpen ? 'Hide competency bank' : 'Browse competency bank'}</button>
        <button className="link" onClick={() => change({ competencies:[...d.competencies,{id:uid(),name:'',source:'Added by company',evidence:'',stageId:'',included:true}] })}>+ Add your own</button>
      </div>
      <p className="reference-tip">AI drafting sends the role description, company values, and hiring steps to OpenAI when you click. Use sample company details in this prototype. <a href="/admin" target="_blank" rel="noreferrer">Admin sign in</a> is required.</p>
      {bankOpen && <section className="bank-panel" id="competency-bank" aria-label="Competency bank">
        <div className="section-head"><div><h2>Competency bank</h2><p>Choose behaviors that matter for this role. Each one is a starting point you can edit.</p></div></div>
        <label>Search competencies<input type="search" value={bankQuery} placeholder="Try judgment, documentation, or coaching" onChange={e => setBankQuery(e.target.value)}/></label>
        <div className="bank-grid">
          {competencyBank.filter(entry => [entry.name,entry.category,entry.evidence].some(text => text.toLowerCase().includes(bankQuery.trim().toLowerCase()))).map(entry => {
            const added = d.competencies.some(c => c.bankId === entry.id || c.name.trim().toLowerCase() === entry.name.toLowerCase())
            return <div className="bank-option" key={entry.id}>
              <span className="bank-category">{entry.category}</span>
              <h3>{entry.name}</h3><p>{entry.evidence}</p>
              <button className="secondary" disabled={added} onClick={() => addFromBank(entry)}>{added ? 'Added' : 'Add competency'}</button>
            </div>
          })}
        </div>
        {!competencyBank.some(entry => [entry.name,entry.category,entry.evidence].some(text => text.toLowerCase().includes(bankQuery.trim().toLowerCase()))) && <p className="bank-empty">No matches. Use “Add your own” for a behavior specific to this role.</p>}
      </section>}
      {!d.competencies.length && <div className="empty">No competencies yet. Generate suggestions, browse the bank, or add your own.</div>}
      {d.competencies.map(c => {
        const suggested = recommendStep(c, d.stages)
        return <section className="card competency" key={c.id}>
          <div className="card-head"><label className="check"><input type="checkbox" checked={c.included} onChange={e=>change({competencies:d.competencies.map(x=>x.id===c.id?{...x,included:e.target.checked}:x),referenceCompetencyIds:e.target.checked?d.referenceCompetencyIds:d.referenceCompetencyIds.filter(id=>id!==c.id)})}/> Include</label><span className="tag">{c.source}</span><button className="link" onClick={() => change({competencies:d.competencies.filter(x=>x.id!==c.id),referenceCompetencyIds:d.referenceCompetencyIds.filter(id=>id!==c.id)})}>Remove</button></div>
          <label>Competency<input value={c.name} onChange={e=>editComp(c.id,{name:e.target.value})}/></label>
          <label>What would demonstrate it?<textarea value={c.evidence} onChange={e=>editComp(c.id,{evidence:e.target.value})}/></label>
          {c.matchText && <div className="role-match"><strong>Why this appeared</strong>{c.matchCues?.length ? <p>Matched wording: {c.matchCues.join(', ')}</p> : null}<blockquote>{c.matchText}</blockquote></div>}
          {suggested && <div className="step-suggestion"><div><strong>Suggested step: {suggested.name}</strong><p>{suggested.reason} Check that this step can gather comparable evidence for every candidate.</p></div><button className="secondary" disabled={c.stageId===suggested.stageId} onClick={()=>editComp(c.id,{stageId:suggested.stageId})}>{c.stageId===suggested.stageId?'Assigned':'Use suggestion'}</button></div>}
          {!suggested && c.name.trim() && d.stages.length>0 && <p className="step-unmatched">No clear step match yet. Choose a step where you can ask the same question or observe the same task for each candidate.</p>}
          <label>Assess at this step<select value={c.stageId} onChange={e=>editComp(c.id,{stageId:e.target.value})}><option value="">Choose a step</option>{d.stages.filter(s => !isReferenceStage(s)).map(s=><option key={s.id} value={s.id}>{s.name || 'Untitled step'}</option>)}</select></label>
        </section>
      })}
      {d.stages.some(isReferenceStage) && <section className="reference-selection"><h2>Reference check</h2><p>Which two or three job-related behaviors should a reference help verify? Ask the same core questions for each candidate. The reference check adds evidence; it does not replace an interview step.</p>{d.competencies.filter(c=>c.included && c.name.trim()).map(c=><label className="check" key={c.id}><input type="checkbox" checked={d.referenceCompetencyIds.includes(c.id)} disabled={!d.referenceCompetencyIds.includes(c.id) && d.referenceCompetencyIds.length>=3} onChange={e=>change({referenceCompetencyIds:e.target.checked?[...d.referenceCompetencyIds,c.id]:d.referenceCompetencyIds.filter(id=>id!==c.id)})}/>{c.name}</label>)}{!d.competencies.some(c=>c.included && c.name.trim()) && <p>Include competencies above to select them here.</p>}<small>{d.referenceCompetencyIds.filter(id=>d.competencies.some(c=>c.id===id && c.included)).length} of 3 selected</small></section>}
      {d.competencies.some(c=>c.source==='Company value') && <div className="hint">Review overlap between a role competency and a value. Count the same behavior twice only if you intend to.</div>}
    </>}
    {page === 5 && <><h1>Review the <em>interview kit.</em></h1><p className="lead">Edit every question and scoring anchor before managers use it. Changes return the kit to draft. Names, evidence notes, and ratings entered on this screen are for printing; they are not saved.</p><div className="actions no-print"><button className="secondary" onClick={makeKit}>Generate or refresh draft</button><button className="secondary" disabled={aiBusy} onClick={() => void aiDraft('tailor')}>{aiBusy ? 'Drafting…' : 'Tailor questions with AI'}</button><button className="secondary" disabled={!d.items.length} onClick={()=>window.print()}>Print / save PDF</button><button className="primary" disabled={!d.items.length || !!countIssues.length} onClick={()=>{setD(old=>({...old,approved:true}));setMessage('Kit approved in this browser prototype.')}}>Approve kit</button><span className={'badge '+(d.approved?'approved':'')}>{d.approved?'Approved':'Draft'}</span></div>{!!countIssues.length && <div className="hint"><strong>Question counts need attention before approval</strong>{countIssues.map(issue=><p key={issue}>{issue}</p>)}<p>Set counts in Hiring steps, then generate or refresh the draft.</p></div>}{!d.items.length && <div className="empty">Assign competencies to steps, then generate the kit.</div>}{!!d.items.length && <section className="guide"><div className="eyebrow">MANAGER GUIDE</div><h2>Use the kit consistently</h2><p>Ask the approved core questions. Use follow-ups to clarify what the candidate personally did. Record examples beside each score, then score before discussing candidates with others. Mark missing evidence instead of guessing.</p><p><strong>Scale:</strong> 1 = below the described behavior · 2 = between 1 and 3 · 3 = meets it · 4 = between 3 and 5 · 5 = exceeds it.</p></section>}{!!d.items.length && d.stages.map((s,i)=>{const items=d.items.filter(q=>d.competencies.find(c=>c.id===q.competencyId)?.stageId===s.id);return isReferenceStage(s)?<ReferenceGuide key={s.id} stage={s} index={i} items={d.referenceItems.filter(q=>q.stageId===s.id || (!q.stageId && d.stages.filter(isReferenceStage).length===1))} backgroundItems={(d.backgroundItems || []).filter(q=>q.stageId===s.id)} onEditBackground={editBackground} competencies={d.competencies} onEdit={editReferenceItem}/>:<section className="kit-stage" key={s.id}><div className="stage-title"><div className="eyebrow">STEP {String(i+1).padStart(2,'0')}</div><h2>{s.name}</h2><p>{s.owner} · {s.method}</p><p>{s.purpose}</p><p><strong>{items.length + (d.backgroundItems || []).filter(q=>q.stageId===s.id).length} core questions</strong> · {items.length} competency questions · {(d.backgroundItems || []).filter(q=>q.stageId===s.id).length} background questions</p></div><BackgroundQuestions items={(d.backgroundItems || []).filter(q=>q.stageId===s.id)} onEdit={editBackground}/>{!items.length && !backgroundTemplates(s).length && <p>No scored questions assigned. This step is informational.</p>}{items.map(q=>{const c=d.competencies.find(x=>x.id===q.competencyId)!;return <article className="card" key={q.id}><div className="card-head"><span className="tag">{c.name}</span><small>{c.source}</small></div><label>Question or task<textarea value={q.question} onChange={e=>editItem(q.id,{question:e.target.value})}/><span className="print-field">{q.question}</span></label><label>Follow-up prompts<input value={q.probe} onChange={e=>editItem(q.id,{probe:e.target.value})}/><span className="print-field">{q.probe}</span></label><div className="anchors">{([['1','low'],['3','meets'],['5','high']] as const).map(([n,key])=><label key={n}><b>{n}</b><textarea value={q[key]} onChange={e=>editItem(q.id,{[key]:e.target.value})}/><span className="print-field">{q[key]}</span></label>)}</div><div className="score"><label>Evidence notes<textarea value={notes[q.id] || ""} onChange={e=>setNotes(old=>({...old,[q.id]:e.target.value}))} placeholder="What did the candidate say or do?"/><span className="print-field print-notes">{notes[q.id] || " "}</span></label><label>Score<select value={scores[q.id] || ""} onChange={e=>setScores(old=>({...old,[q.id]:e.target.value}))}><option value="">Not scored</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select><span className="print-field">{scores[q.id] || "Not scored"}</span></label></div></article>})}<p className="decision"><strong>Decision point:</strong> {s.advance || 'Not yet defined.'}</p></section>})}</>}
    {message && <div className="toast" role="status">{message}<button onClick={()=>setMessage('')}>×</button></div>}{page>0&&page<5&&<div className="bottom"><button className="link" onClick={()=>setPage(page-1)}>← Back</button><button className="primary" onClick={()=>setPage(page+1)}>Continue →</button></div>}
  </main></div></div>
}
export default App
