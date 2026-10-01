import test from 'node:test'
import assert from 'node:assert/strict'
import { assessmentPlan, questionTarget, backgroundTemplates } from '../src/questionPlanning.ts'
import { draftWithAI } from '../aiDraft.mjs'

test('configured counts cover all competencies and produce distinct question slots', () => {
  const slots = assessmentPlan([{ id: 's', name: 'Manager', questionCount: 5 }], [{ id: 'a', stageId: 's' }, { id: 'b', stageId: 's' }])
  assert.equal(slots.length, 5)
  assert.equal(new Set(slots.map(q => q.questionKey)).size, 5)
  assert.deepEqual(slots.map(q => q.competencyId), ['a', 'b', 'a', 'b', 'a'])
  assert.equal(slots[4].variant, 2)
})
test('insufficient counts and missing assignments cannot silently omit competency coverage', () => {
  assert.throws(() => assessmentPlan([{ id: 's', name: 'Manager', questionCount: 1 }], [{ id: 'a', stageId: 's' }, { id: 'b', stageId: 's' }]), /Increase the count/)
  assert.throws(() => assessmentPlan([{ id: 's', name: 'Manager', questionCount: 3 }], []), /Assign a competency/)
  assert.deepEqual(assessmentPlan([{ id: 's', name: 'Site visit/tour' }], []), [])
})
test('screening and reference templates remain separate from competency counts', () => {
  assert.equal(backgroundTemplates({ id: 's', name: 'Initial/Screening interview' }).length, 5)
  assert.equal(backgroundTemplates({ id: 'r', name: 'Reference check' }).length, 10)
  assert.equal(questionTarget({ id: 'r', name: 'Reference check' }), 3)
  assert.equal(backgroundTemplates({ id: 'custom', name: 'Initial/Screening interview', template: 'custom' }).length, 5)
})
const questionPlan = [{ questionKey: 's:0', competencyId: 'a', stageId: 's', variant: 0 }, { questionKey: 's:1', competencyId: 'a', stageId: 's', variant: 1 }]
const input = { mode: 'tailor', role: 'Example', description: 'Checks the accuracy of finished work.', stages: [{ id: 's', name: 'Manager' }], competencies: [{ id: 'a', name: 'Quality', evidence: 'Checks work', stageId: 's' }], questionPlan }
const item = slot => ({ ...slot, question: 'Describe a quality check.', probe: 'What did you do?', low: 'Misses an error.', meets: 'Checks work.', high: 'Checks and improves the process.' })
const mock = items => async (_url, options) => {
  assert.equal(JSON.parse(options.body).store, false)
  return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ items }) }] }] }) }
}
test('AI preserves exact requested counts including repeated competencies', async () => {
  const result = await draftWithAI(input, mock(questionPlan.toReversed().map(item)))
  assert.deepEqual(result.items.map(q => q.questionKey), ['s:0', 's:1'])
})
test('AI rejects missing or duplicated slots without accepting partial drafts', async () => {
  await assert.rejects(draftWithAI(input, mock([item(questionPlan[0])])), /AIInvalidResponse/)
  await assert.rejects(draftWithAI(input, mock([item(questionPlan[0]), item(questionPlan[0])])), /AIInvalidResponse/)
})
