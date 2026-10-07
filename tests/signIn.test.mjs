import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'

let child, base
before(async () => {
  const socket = createServer().listen(0, '127.0.0.1')
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  base = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: String(port), ADMIN_PASSWORD: 'local-test-only', OPENAI_API_KEY: '', DATABASE_URL: '', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw new Error('Server did not start') })])
})
after(async () => {
  const done = once(child, 'exit')
  child.kill('SIGTERM')
  await done
})
const post = (path, headers = {}, password = 'local-test-only') => fetch(`${base}${path}`, {
  method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
  body: new URLSearchParams({ password }),
})

test('dedicated sign-in identifies the product and keeps same-site form provenance', async () => {
  const res = await fetch(`${base}/sign-in`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('referrer-policy'), 'same-origin')
  assert.equal(res.headers.get('cache-control'), 'no-store')
  const html = await res.text()
  assert.match(html, /Sign in \| Interview Design Studio/)
  assert.match(html, /action="\/sign-in"/)
  assert.match(html, /operated by E Factor Leadership and hosted on Railway/)
  assert.doesNotMatch(html, /Error monitor/)
})
test('workspace sign-in returns to the tool with a protected cookie', async () => {
  const res = await post('/sign-in', { origin: base })
  assert.equal(res.status, 303)
  assert.equal(res.headers.get('location'), '/')
  for (const flag of ['HttpOnly', 'SameSite=Strict', 'Secure']) assert.ok(res.headers.get('set-cookie').includes(flag))
  const authenticated = await fetch(`${base}/sign-in`, { redirect: 'manual', headers: { cookie: res.headers.get('set-cookie').split(';')[0] } })
  assert.equal(authenticated.status, 303)
  assert.equal(authenticated.headers.get('location'), '/')
})
test('administrator sign-in keeps its original destination', async () => {
  const res = await post('/admin/login', { origin: base })
  assert.equal(res.status, 303)
  assert.equal(res.headers.get('location'), '/admin')
})
test('same-site referer fallback works and unverifiable requests fail', async () => {
  assert.equal((await post('/sign-in', { 'sec-fetch-site': 'same-origin', referer: `${base}/sign-in` })).status, 303)
  for (const headers of [{ origin: 'https://unrelated.example' }, { origin: 'null' }, {}]) {
    const res = await post('/sign-in', headers)
    assert.equal(res.status, 403)
    assert.equal(res.headers.get('set-cookie'), null)
  }
})
test('wrong passwords remain retryable without creating a session', async () => {
  const res = await post('/sign-in', { origin: base }, 'incorrect-test-password')
  assert.equal(res.status, 401)
  assert.equal(res.headers.get('set-cookie'), null)
  assert.match(await res.text(), /The password did not match/)
  assert.equal((await post('/sign-in', { origin: base })).status, 303)
})
test('AI still requires authentication and old login GET recovers to sign-in', async () => {
  const ai = await fetch(`${base}/api/ai/draft`, { method: 'POST' })
  assert.equal(ai.status, 401)
  assert.match((await ai.json()).error, /\/sign-in/)
  const legacy = await fetch(`${base}/admin/login`, { redirect: 'manual' })
  assert.equal(legacy.status, 303)
  assert.equal(legacy.headers.get('location'), '/sign-in')
})
