export type PlannedStage = { id: string; name: string; template?: string; questionCount?: number }
export type BackgroundItem = { id: string; stageId: string; title: string; question: string; probe: string }
export const screeningQuestions = [
  ['Work history', 'Walk me through your relevant work history. What were your responsibilities in each role?', 'Which responsibilities did you personally own?'],
  ['Job changes', 'What led you to make your recent job changes, and what are you looking for in your next role?', 'Share only the work-related context you are comfortable discussing.'],
  ['Interest in the role', 'What interests you about this role and the work described in the posting?', 'Which responsibilities would you most like to learn more about?'],
  ['Relevant experience', 'Which parts of your experience best prepare you for this role? Give an example tied to a stated responsibility.', 'Where would you need training or support?'],
  ['Work arrangement and availability', 'The role’s approved work arrangement and schedule are: [enter the stated in-office, remote, or hybrid requirements]. Are you available for those requirements, and when could you start?', 'Confirm the stated requirements first. Ask about availability without asking for personal reasons.'],
]
export const referenceQuestions = [
  ['Working relationship', 'What was your role, how did you work with this person, and during what period?', 'How directly and how recently did you observe their work?'],
  ['Working with others', 'Describe how this person worked with colleagues or customers. What specific example stands out?', 'How did they handle disagreement or a difficult handoff?'],
  ['Communication', 'How did this person communicate information, questions, and concerns at work?', 'What example shows how they adapted to the audience or situation?'],
  ['Reliability', 'What did you observe about their follow-through on agreed commitments?', 'How did they communicate when a commitment was at risk?'],
  ['Attention to detail', 'How did this person check the quality and accuracy of their work?', 'Describe an error they caught or corrected and what happened afterward.'],
  ['Receiving feedback', 'Describe a time this person received constructive feedback. What did they do with it?', 'What change did you observe afterward?'],
  ['Strengths', 'What work-related strengths did you observe most consistently?', 'Which responsibilities made the best use of those strengths?'],
  ['Areas for improvement', 'Which work-related skills or practices would benefit from further development?', 'What support helped, and what progress did you observe?'],
  ['Rehire', 'If your organization permits you to answer, would you rehire this person for a similar role? What job-related observations support your answer?', 'Distinguish organizational eligibility rules from your own experience. Unable to answer is not negative evidence.'],
  ['Setting them up for success', 'What guidance would you give their next manager to help this person succeed?', 'What onboarding, expectations, feedback, or working conditions helped them do their best work?'],
]
export function stageKind(stage: PlannedStage) { return stage.template && stage.template !== 'custom' ? stage.template : stage.name }
export function backgroundTemplates(stage: PlannedStage) {
  const kind = stageKind(stage)
  return kind === 'Reference check' ? referenceQuestions : kind === 'Initial/Screening interview' ? screeningQuestions : []
}
export function questionTarget(stage: PlannedStage) {
  if (Number.isInteger(stage.questionCount) && stage.questionCount! >= 0 && stage.questionCount! <= 12) return stage.questionCount!
  const kind = stageKind(stage)
  return kind === 'Site visit/tour' ? 0 : kind === 'Hiring Manager interview' ? 5 : kind === 'Reference check' || kind === 'Initial/Screening interview' ? 3 : 4
}
export function assessmentPlan(stages: PlannedStage[], competencies: { id: string; stageId: string }[]) {
  return stages.flatMap(stage => {
    const assigned = competencies.filter(c => c.stageId === stage.id)
    const target = questionTarget(stage)
    if (target && !assigned.length) throw new Error(`Assign a competency to ${stage.name || 'each step'} or set its competency question count to zero.`)
    if (assigned.length > target) throw new Error(`${stage.name}: ${assigned.length} competencies need at least ${assigned.length} questions. Increase the count or reassign competencies.`)
    return Array.from({ length: target }, (_, index) => ({ questionKey: `${stage.id}:${index}`, competencyId: assigned[index % assigned.length].id, stageId: stage.id, variant: Math.floor(index / assigned.length) }))
  })
}
