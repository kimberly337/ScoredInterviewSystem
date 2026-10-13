import { useEffect, useState } from 'react'
import { companyApi, type CompanyUser, type SavedRecord } from './companyApi'
import type { Draft } from './App'
type Props = { user: CompanyUser; draft: Draft; onLoad: (draft: Draft) => void; beforeLeave: () => boolean }
export default function CompanyToolbar({ user, draft, onLoad, beforeLeave }: Props) {
  const [records, setRecords] = useState<SavedRecord<Draft>[]>([])
  const [selected, setSelected] = useState<SavedRecord<Draft>>()
  const [saved, setSaved] = useState('')
  const [message, setMessage] = useState('Opening draft has not been saved to your company.')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [invitation, setInvitation] = useState('')
  const [members, setMembers] = useState<{id:string; email:string; role:string; disabled:boolean}[]>([])
  const [manage, setManage] = useState(false)
  const dirty = JSON.stringify(draft) !== saved
  const refresh = async () => { const result = await companyApi<{records:SavedRecord<Draft>[]}>('records?kind=kit'); setRecords(result.records) }
  useEffect(()=>{ void companyApi<{records:SavedRecord<Draft>[]}>('records?kind=kit').then(result=>setRecords(result.records)).catch(e=>setMessage(e.message)) },[])
  useEffect(()=>{
    if(!dirty) return
    const warn=(e:BeforeUnloadEvent)=>{e.preventDefault()}
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)
  },[dirty])
  const leave = () => beforeLeave() && (!dirty || window.confirm('This opening has unsaved changes. Save it before leaving if you want to keep them. Continue?'))
  const save = async (copy=false) => {
    setBusy(true)
    try {
      const result=await companyApi<{record:SavedRecord<Draft>}>('records',{id:copy || !selected ? crypto.randomUUID() : selected.id,kind:'kit',revision:copy || !selected ? 0 : selected.revision,data:draft})
      setSelected(result.record);setSaved(JSON.stringify(draft));setMessage('Opening saved to '+user.company_name+'.');await refresh()
    }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
  }
  return <section className="company-toolbar no-print"><div><strong>{user.company_name}</strong><span>{user.email}</span></div><div className="actions"><label>Saved openings<select value={selected?.id || ''} onChange={e=>{
    const record=records.find(r=>r.id===e.target.value);if(!record || !leave())return
    setSelected(record);setSaved(JSON.stringify(record.data));onLoad(record.data);setMessage('Saved opening loaded.')
  }}><option value="">Choose an opening</option>{records.map(r=><option key={r.id} value={r.id}>{r.data.role}</option>)}</select></label><button className="primary" disabled={busy || !draft.role.trim()} onClick={()=>void save()}>{busy?'Saving…':'Save opening'}</button><button className="secondary" disabled={busy || !draft.role.trim()} onClick={()=>void save(true)}>Save as new opening</button><button className="secondary" onClick={()=>{if(leave())window.location.reload()}}>New opening</button>{user.role==='admin' && <button className="secondary" onClick={()=>{setManage(!manage);void companyApi<{members:typeof members}>('members').then(r=>setMembers(r.members)).catch(e=>setMessage(e.message))}}>Manage team</button>}<button className="secondary" onClick={()=>{if(leave())void companyApi('logout',{}).then(()=>window.location.reload()).catch(e=>setMessage(e.message))}}>Sign out</button></div><p role="status">{dirty?'Unsaved opening changes. ':''}{message}</p>{manage && <div className="card"><h2>Company team</h2><p>Invite only people authorized to access all openings and candidate records in this company. Invitations expire after seven days.</p><label>Team member email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="secondary" disabled={busy} onClick={async()=>{setBusy(true);try{const result=await companyApi<{activationPath:string}>('invite',{email});setInvitation(window.location.origin+result.activationPath);setEmail('');const resultMembers=await companyApi<{members:typeof members}>('members');setMembers(resultMembers.members)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}}>Create invitation</button>{invitation && <label>One-time invitation link<input readOnly value={invitation}/><small>Share this link privately with the invited person. No email is sent automatically.</small></label>}{members.map(m=><p key={m.id}>{m.email} · {m.role} · {m.disabled?'Access removed':'Active'} {!m.disabled && <button className="secondary" onClick={async()=>{try{const result=await companyApi<{activationPath:string}>('recovery',{id:m.id});setInvitation(window.location.origin+result.activationPath);setMessage('One-day recovery link created. Share it privately with this account owner.')}catch(e){setMessage((e as Error).message)}}}>Create recovery link</button>} {m.id!==user.id && !m.disabled && <button className="secondary" onClick={async()=>{if(!window.confirm('Remove this person’s company access?'))return;try{await companyApi('disable',{id:m.id});setMembers(old=>old.map(x=>x.id===m.id?{...x,disabled:true}:x))}catch(e){setMessage((e as Error).message)}}}>Remove access</button>}</p>)}</div>}</section>
}
