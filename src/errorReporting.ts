type Category = 'window_error' | 'unhandled_rejection' | 'render_error' | 'job_description_import' | 'ai_draft'

export function reportError(category: Category, error?: unknown, location?: { filename?: string; lineno?: number; colno?: number }) {
  const kind = error instanceof Error ? error.name : 'UnknownError'
  const asset = location?.filename ? new URL(location.filename, window.location.href).pathname : ''
  const report = {
    category,
    kind: /^[A-Za-z]{1,40}$/.test(kind) ? kind : 'UnknownError',
    asset: /^\/assets\/[A-Za-z0-9_.-]+$/.test(asset) ? asset : '',
    line: Number.isInteger(location?.lineno) ? location?.lineno : 0,
    column: Number.isInteger(location?.colno) ? location?.colno : 0,
  }
  // Error messages, stacks, form values, file names, and candidate data stay in the browser.
  void fetch('/api/errors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(report), keepalive: true }).catch(() => {})
}
