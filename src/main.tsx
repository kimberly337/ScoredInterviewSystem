import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reportError } from './errorReporting.ts'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { reportError('render_error', error) }
  render() {
    return this.state.failed
      ? <main style={{ maxWidth: 560, margin: '12vh auto', padding: 24 }}><h1>Something went wrong.</h1><p>We recorded a technical error. Reload the page to try again. Your draft is saved in this browser.</p></main>
      : this.props.children
  }
}

window.addEventListener('error', event => reportError('window_error', event.error, event))
window.addEventListener('unhandledrejection', event => reportError('unhandled_rejection', event.reason))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
