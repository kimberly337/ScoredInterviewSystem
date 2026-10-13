import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WorkspaceGate from './WorkspaceGate'
import { reportError } from './errorReporting.ts'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { reportError('render_error', error) }
  render() {
    return this.state.failed
      ? <main style={{ maxWidth: 560, margin: '12vh auto', padding: 24 }}><h1>Something went wrong.</h1><p>We recorded a technical error. Reload the page to try again. Reopen your last saved record. Unsaved changes may need to be entered again.</p></main>
      : this.props.children
  }
}

window.addEventListener('error', event => reportError('window_error', event.error, event))
window.addEventListener('unhandledrejection', event => reportError('unhandled_rejection', event.reason))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><WorkspaceGate /></ErrorBoundary>
  </StrictMode>,
)
