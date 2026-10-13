export type CompanyUser = { id: string; company_id: string; company_name: string; email: string; role: 'admin' | 'member' }
export type SavedRecord<T> = { id: string; kind: 'kit' | 'candidate'; parentId: string | null; revision: number; updatedAt: string; archived: boolean; data: T }
export async function companyApi<T>(path: string, input?: unknown): Promise<T> {
  const response = await fetch('/api/company/' + path, { method: input === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: input === undefined ? {} : { 'content-type': 'application/json' }, ...(input === undefined ? {} : { body: JSON.stringify(input) }) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'The workspace request failed. Your changes have not been saved.')
  return result as T
}
