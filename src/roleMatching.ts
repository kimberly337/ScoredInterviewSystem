import { competencyBank, type BankEntry } from './competencyBank'

export type RoleMatch = { entry: BankEntry; cues: string[]; excerpt: string; score: number }

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function matchRoleCompetencies(description: string, limit = 8): RoleMatch[] {
  const source = description.trim()
  if (!source) return []
  return competencyBank.flatMap(entry => {
    const found = entry.signals.flatMap(signal => {
      const pattern = new RegExp(`\\b${escapePattern(signal)}\\b`, 'i')
      const match = pattern.exec(source)
      return match ? [{ signal, index: match.index }] : []
    })
    if (!found.length) return []
    found.sort((a, b) => b.signal.length - a.signal.length)
    const first = found[0]
    const start = Math.max(0, first.index - 65)
    const end = Math.min(source.length, first.index + first.signal.length + 95)
    const excerpt = `${start ? '…' : ''}${source.slice(start, end).replace(/\s+/g, ' ').trim()}${end < source.length ? '…' : ''}`
    const fullName = new RegExp(`\\b${escapePattern(entry.name)}\\b`, 'i').test(source)
    const score = found.length * 2 + (fullName ? 3 : 0) + (first.signal.includes(' ') ? 1 : 0)
    return [{ entry, cues: found.map(item => item.signal), excerpt, score }]
  }).sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name)).slice(0, limit)
}
