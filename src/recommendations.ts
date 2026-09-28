type Step = { id: string; name: string; template?: string; method: string }
type Competency = { name: string; source: string }

// These are editable starting suggestions, not an assessment of a candidate.
export function recommendStep(competency: Competency, steps: Step[]) {
  const skill = competency.name.toLowerCase()
  const scores = steps.map(step => {
    const kind = (step.template && step.template !== 'custom' ? step.template : step.name).toLowerCase()
    const practical = /work sample|practical|task|exercise|demonstration/.test(`${step.name} ${step.method}`.toLowerCase())
    let score = 0
    let reason = ''
    if (practical && /quality|detail|safe|technical|troubleshoot|problem solving|documentation|process/.test(skill)) {
      score = 6
      reason = 'A structured task can show this behavior in work similar to the role.'
    } else if (/team interview/.test(kind) && /collaborat|team|coaching|feedback|communicat/.test(skill)) {
      score = 5
      reason = 'The team can ask for a specific example of working with others.'
    } else if (/stakeholder interview/.test(kind) && /stakeholder|partnership|customer|client|influenc/.test(skill)) {
      score = 5
      reason = 'A stakeholder can explore how the person works across groups.'
    } else if (/sr leader|senior leader/.test(kind) && /strateg|leadership|leading|change management/.test(skill)) {
      score = 5
      reason = 'A senior leader can explore decisions and broader role outcomes.'
    } else if (/hiring manager interview/.test(kind) && (/judg|decision|fact.find|discretion|confidential|policy|prioriti|planning|delivery|problem|improvement|quality|safe|documentation|learning|adapt/.test(skill) || competency.source === 'Company value')) {
      score = 4
      reason = 'The hiring manager can probe a job example against this behavior.'
    } else if (/initial|screening/.test(kind) && /communicat|learning|adapt|requirement/.test(skill)) {
      score = 3
      reason = 'The screening interview can gather an initial job-related example.'
    } else if (/team interview/.test(kind) && competency.source === 'Company value') {
      score = 2
      reason = 'The team can ask for an example of this value in action.'
    }
    return { step, score, reason }
  })
  const best = scores.sort((a, b) => b.score - a.score)[0]
  return best?.score ? { stageId: best.step.id, name: best.step.name, reason: best.reason } : null
}
