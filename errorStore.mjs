import { createHash } from 'node:crypto'
import pg from 'pg'

const { Pool } = pg
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 5000 }) : null
let ready = false
const memory = new Map()

async function ensureDatabase() {
  if (!pool || ready) return ready
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS error_events (
      fingerprint text PRIMARY KEY,
      source varchar(20) NOT NULL,
      category varchar(40) NOT NULL,
      kind varchar(40) NOT NULL,
      asset varchar(160) NOT NULL DEFAULT '',
      line integer NOT NULL DEFAULT 0,
      column_no integer NOT NULL DEFAULT 0,
      first_seen timestamptz NOT NULL DEFAULT now(),
      last_seen timestamptz NOT NULL DEFAULT now(),
      occurrences integer NOT NULL DEFAULT 1
    )`)
    await pool.query('CREATE INDEX IF NOT EXISTS error_events_recent ON error_events (last_seen DESC)')
    await pool.query("DELETE FROM error_events WHERE last_seen < now() - interval '90 days'")
    ready = true
  } catch (error) {
    console.error(JSON.stringify({ type: 'telemetry_store_unavailable', kind: error?.name || 'Error' }))
  }
  return ready
}

export async function recordError(event) {
  const fingerprint = createHash('sha256').update([event.source, event.category, event.kind, event.asset, event.line, event.column].join('|')).digest('hex')
  const now = new Date().toISOString()
  const previous = memory.get(fingerprint)
  memory.set(fingerprint, { ...event, fingerprint, first_seen: previous?.first_seen || now, last_seen: now, occurrences: (previous?.occurrences || 0) + 1 })
  if (memory.size > 200) memory.delete(memory.keys().next().value)
  console.error(JSON.stringify({ type: 'app_error', source: event.source, category: event.category, kind: event.kind, fingerprint }))
  if (await ensureDatabase()) {
    try {
      await pool.query(`INSERT INTO error_events (fingerprint, source, category, kind, asset, line, column_no)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (fingerprint) DO UPDATE SET last_seen = now(), occurrences = error_events.occurrences + 1`,
      [fingerprint, event.source, event.category, event.kind, event.asset, event.line, event.column])
    } catch (error) {
      ready = false
      console.error(JSON.stringify({ type: 'telemetry_write_failed', kind: error?.name || 'Error' }))
    }
  }
}

export async function getErrorSummary() {
  if (await ensureDatabase()) {
    try {
      const [events, counts] = await Promise.all([
        pool.query('SELECT source, category, kind, asset, line, column_no, first_seen, last_seen, occurrences FROM error_events ORDER BY last_seen DESC LIMIT 100'),
        pool.query(`SELECT COUNT(*) FILTER (WHERE last_seen >= now() - interval '24 hours')::int AS last_day,
          COUNT(*)::int AS distinct_errors, COALESCE(SUM(occurrences),0)::int AS total_occurrences FROM error_events`),
      ])
      return { mode: 'persistent', events: events.rows, counts: counts.rows[0] }
    } catch (error) {
      ready = false
      console.error(JSON.stringify({ type: 'telemetry_read_failed', kind: error?.name || 'Error' }))
    }
  }
  const events = [...memory.values()].sort((a, b) => b.last_seen.localeCompare(a.last_seen))
  const lastDay = Date.now() - 24 * 60 * 60 * 1000
  return { mode: 'memory', events, counts: { last_day: events.filter(e => Date.parse(e.last_seen) >= lastDay).length, distinct_errors: events.length, total_occurrences: events.reduce((sum, e) => sum + e.occurrences, 0) } }
}

export async function closeStore() { await pool?.end() }
