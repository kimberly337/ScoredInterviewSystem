import { useState } from 'react'

export default function RequirementRating() {
  const [rating, setRating] = useState('')
  return <label>Role requirement assessment<select value={rating} onChange={e => setRating(e.target.value)}><option value="">Not assessed</option><option>3 — Meets role requirements</option><option>0 — Does not meet role requirements</option><option>Pending — Insufficient evidence</option></select><span className="print-field">{rating || 'Not assessed — select: 3 — Meets role requirements / 0 — Does not meet role requirements / Pending — Insufficient evidence'}</span></label>
}
