import { test } from 'node:test'
import assert from 'node:assert/strict'
import { draftWithAI, aiFailureMessage } from '../aiDraft.mjs'

const request = { mode: 'suggest', role: 'Fictional coordinator', description: 'Coordinate service requests.', stages: [{ id: 'screen', name: 'Screening' }] }
test('provider failures distinguish billing from rate limits without retaining provider messages', async () => {
  for (const [status, code, name] of [[401, 'invalid_api_key', 'AIAuthenticationError'], [429, 'insufficient_quota', 'AIQuotaError'], [429, 'rate_limit_exceeded', 'AIRateLimitError'], [403, 'permission_denied', 'AIPermissionError'], [400, 'invalid_request', 'AIRequestError'], [503, null, 'AIProviderError']]) {
    await assert.rejects(draftWithAI(request, async () => new Response(JSON.stringify({ error: { code, message: 'private provider details' } }), { status })), error => {
      assert.equal(error.name, name)
      assert.equal(error.message, name)
      assert.ok(!aiFailureMessage(error).includes('private provider details'))
      return true
    })
  }
})
test('timeout and network failures do not retain sensitive exception messages', async () => {
  for (const [type, expected] of [['AbortError', 'AITimeoutError'], ['TypeError', 'AINetworkError']]) {
    await assert.rejects(draftWithAI(request, async () => { throw Object.assign(new Error('private connection details'), { name: type }) }), { name: expected, message: expected })
  }
})
test('valid suggestions continue to work', async () => {
  const suggestions = [{ name: 'Communication', evidence: 'Provides clear updates', reason: 'Coordinates client requests', stageId: 'screen' }]
  const actual = await draftWithAI(request, async () => new Response(JSON.stringify({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ suggestions }) }] }] })))
  assert.deepEqual(actual, { suggestions })
})
