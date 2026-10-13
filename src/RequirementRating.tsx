import { useState } from 'react'

export default function RequirementRating() {
  const [rating, setRating] = useState('')
  return <label>Role requirement assessment<select value={rating} onChange={e => setRating(e.target.value)}><option value="">Not assessed</option><option>Meets role requirements</option><option>Does not meet role requirements</option><option>Insufficient evidence</option></select><span className="print-field">{rating || 'Not assessed — select: Meets role requirements / Does not meet role requirements / Insufficient evidence'}</span></label>
}
