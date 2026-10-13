import { useEffect, useState } from 'react'
import App from './App'
import { companyApi, type CompanyUser } from './companyApi'
export default function WorkspaceGate() {
  const [state, setState] = useState<'loading' | 'preview' | 'login' | 'error' | 'ready'>('loading')
  const [candidateReady, setCandidateReady] = useState(false)
  const [user, setUser] = useState<CompanyUser>()
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const status = await companyApi<{ enabled: boolean; configured: boolean; candidateReady: boolean }>('status')
        if (!active) return
        setCandidateReady(status.candidateReady)
        if (!status.enabled) { setState('preview'); return }
        if (!status.configured) { setState('error'); return }
        try { const result = await companyApi<{ user: CompanyUser }>('session'); if(active) { setUser(result.user); setState('ready') } }
        catch { if(active) setState('login') }
      } catch { if(active) setState('error') }
    })()
    return () => { active = false }
  }, [])
  if(state === 'preview') return <App/>
  if(state === 'ready' && user) return <App companyUser={user} candidateReady={candidateReady}/>
  return <main className="account-gate"><img src="/efactor-logo.png" alt="E Factor Leadership"/><h1>Interview Design Studio</h1>{state === 'loading' ? <p>Opening your workspace…</p> : state === 'login' ? <><p>Sign in to your company’s private workspace to manage openings and candidate scorecards.</p><a className="primary" href="/company/sign-in">Company sign in</a><p>Ask your company administrator for an invitation if you do not have an account.</p></> : <><p>Company storage is unavailable. Candidate records cannot be opened or saved right now.</p><button className="secondary" onClick={()=>window.location.reload()}>Try again</button></>}</main>
}
