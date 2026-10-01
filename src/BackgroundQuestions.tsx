import { useState } from 'react'
import type { BackgroundItem } from './questionPlanning'

export default function BackgroundQuestions({ items, onEdit }: { items: BackgroundItem[]; onEdit: (id: string, patch: Partial<BackgroundItem>) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  if (!items.length) return null
  return <div className="background-questions"><h3>Background and context · {items.length} questions</h3><p>Record work-related context. These answers do not receive a 1–5 score. Keep the approved core questions consistent.</p>{items.map((item, index) => <article className="card" key={item.id}>
    <div className="card-head"><span className="tag">{index + 1}. {item.title}</span><small>Unscored</small></div>
    <label>Core question<textarea value={item.question} onChange={e => onEdit(item.id, { question: e.target.value })}/><span className="print-field">{item.question}</span></label>
    <label>Follow-up prompts<input value={item.probe} onChange={e => onEdit(item.id, { probe: e.target.value })}/><span className="print-field">{item.probe}</span></label>
    <label>Response notes<textarea value={notes[item.id] || ''} onChange={e => setNotes(old => ({ ...old, [item.id]: e.target.value }))}/><span className="print-field print-notes">{notes[item.id] || ' '}</span></label>
  </article>)}</div>
}
