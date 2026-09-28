import { useState } from 'react'

type ReferenceItem = { id: string; competencyId: string; question: string; probe: string }
type Competency = { id: string; name: string; evidence: string }
type Props = {
  stage: { name: string; owner: string; method: string; purpose: string; advance: string }
  index: number
  items: ReferenceItem[]
  competencies: Competency[]
  onEdit: (id: string, patch: Partial<ReferenceItem>) => void
}

export default function ReferenceGuide({ stage, index, items, competencies, onEdit }: Props) {
  const [details, setDetails] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [ratings, setRatings] = useState<Record<string, string>>({})
  const detail = (key: string, label: string) => <label>{label}<input value={details[key] || ''} onChange={e => setDetails(old => ({ ...old, [key]: e.target.value }))}/><span className="print-field print-notes">{details[key] || ' '}</span></label>
  return <section className="kit-stage reference-guide">
    <div className="stage-title"><div className="eyebrow">STEP {String(index + 1).padStart(2, '0')}</div><h2>{stage.name}</h2><p>{stage.owner} · {stage.method}</p><p>{stage.purpose}</p></div>
    <div className="reference-instructions"><strong>One sheet per reference</strong><p>Confirm the candidate has authorized this contact. Ask the same core questions for each candidate and record examples in the reference’s own words. If the reference cannot speak to a behavior, mark “Not observed.” Review specific concerns with the candidate before deciding.</p></div>
    <div className="columns reference-details">{detail('candidate','Candidate')}{detail('reference','Reference name')}{detail('relationship','Working relationship')}{detail('organization','Organization / role')}{detail('period','Period worked together')}{detail('date','Date and checker')}{detail('permission','Permission to contact confirmed by')}</div>
    <p className="reference-opening">Opening: “How did you work with the candidate, and how directly did you observe their work?”</p>
    {items.map(item => {
      const competency = competencies.find(c => c.id === item.competencyId)
      if (!competency) return null
      return <article className="card reference-question" key={item.id}>
        <div className="card-head"><span className="tag">{competency.name}</span></div>
        <label>Core question<textarea value={item.question} onChange={e => onEdit(item.id, { question: e.target.value })}/><span className="print-field">{item.question}</span></label>
        <label>Follow-up prompts<input value={item.probe} onChange={e => onEdit(item.id, { probe: e.target.value })}/><span className="print-field">{item.probe}</span></label>
        <p className="reference-anchor"><strong>Behavior to verify:</strong> {competency.evidence}</p>
        <div className="score"><label>Specific example / evidence notes<textarea value={notes[item.id] || ''} onChange={e => setNotes(old => ({ ...old, [item.id]: e.target.value }))} placeholder="What did the reference directly observe?"/><span className="print-field print-notes">{notes[item.id] || ' '}</span></label><label>Evidence rating<select value={ratings[item.id] || ''} onChange={e => setRatings(old => ({ ...old, [item.id]: e.target.value }))}><option value="">Not rated</option><option>Not observed</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select><span className="print-field">{ratings[item.id] || 'Not rated'}</span></label></div>
      </article>
    })}
    <p className="reference-scale"><strong>Rating guide:</strong> 1 = example worked against the behavior · 3 = specific example meets the behavior · 5 = detailed, repeated evidence exceeds it. Use 2 or 4 between anchors. “Not observed” is missing evidence, not a low score.</p>
    <label>Other job-related facts or concerns to follow up<textarea value={details.summary || ''} onChange={e=>setDetails(old=>({...old,summary:e.target.value}))}/><span className="print-field print-notes">{details.summary || ' '}</span></label>
    <p className="decision"><strong>Decision point:</strong> {stage.advance || 'Review alongside interview evidence. Do not make an automatic decision from this sheet.'}</p>
  </section>
}
