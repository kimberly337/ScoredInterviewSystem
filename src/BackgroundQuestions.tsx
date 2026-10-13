import { useState } from 'react'
import RequirementRating from './RequirementRating'
import type { BackgroundItem } from './questionPlanning'

export default function BackgroundQuestions({ items, onEdit }: { items: BackgroundItem[]; onEdit: (id: string, patch: Partial<BackgroundItem>) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  if (!items.length) return null
  return <div className="background-questions"><h3>Background and context · {items.length} questions</h3><p>Assess each answer against the stated requirements of the position: 3 — Meets role requirements, 0 — Does not meet role requirements, or Pending — Insufficient evidence. Record the requirement and the specific evidence supporting your assessment. Keep the approved core questions and criteria consistent. Pending has no numeric score and is excluded from totals until assessed.</p>{items.map((item, index) => <article className="card" key={item.id}>
    <div className="card-head"><span className="tag">{index + 1}. {item.title}</span><small>Role requirement assessment</small></div>
    <label>Core question<textarea value={item.question} onChange={e => onEdit(item.id, { question: e.target.value })}/><span className="print-field">{item.question}</span></label>
    <label>Follow-up prompts<input value={item.probe} onChange={e => onEdit(item.id, { probe: e.target.value })}/><span className="print-field">{item.probe}</span></label>
    <label>Role requirement and supporting evidence<textarea value={notes[item.id] || ''} onChange={e => setNotes(old => ({ ...old, [item.id]: e.target.value }))}/><span className="print-field print-notes">{notes[item.id] || ' '}</span></label>
  <RequirementRating/>
  </article>)}</div>
}
