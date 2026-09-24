import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)))
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const target = resolve(join(root, pathname.replace(/^\/+/, '')))
    if (target !== root && !target.startsWith(root + sep)) {
      response.writeHead(403).end()
      return
    }
    let file = target
    try {
      if (!(await stat(file)).isFile()) file = join(root, 'index.html')
    } catch {
      file = join(root, 'index.html')
    }
    const body = await readFile(file)
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' }).end(request.method === 'HEAD' ? undefined : body)
  } catch {
    response.writeHead(400).end()
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
  console.log(`Interview studio listening on ${process.env.PORT || 3000}`)
})
