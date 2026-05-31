import http from 'node:http'
import net from 'node:net'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'

const outputDir = new URL('../screenshots/insta-growth-tracker/', import.meta.url)
const appUrl = 'http://127.0.0.1:4173/'

const getJson = (url) =>
  new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let data = ''
        response.on('data', (chunk) => {
          data += chunk
        })
        response.on('end', () => resolve(JSON.parse(data)))
      })
      .on('error', reject)
  })

const encodeFrame = (value) => {
  const payload = Buffer.from(value)
  const mask = crypto.randomBytes(4)
  const header = payload.length < 126 ? Buffer.from([0x81, 0x80 | payload.length]) : Buffer.alloc(4)
  if (payload.length >= 126) {
    header[0] = 0x81
    header[1] = 0x80 | 126
    header.writeUInt16BE(payload.length, 2)
  }
  const frame = Buffer.alloc(header.length + 4 + payload.length)
  header.copy(frame, 0)
  mask.copy(frame, header.length)
  for (let index = 0; index < payload.length; index += 1) frame[header.length + 4 + index] = payload[index] ^ mask[index % 4]
  return frame
}

const decodeFrames = (buffer) => {
  const frames = []
  let offset = 0
  while (offset + 2 <= buffer.length) {
    const first = buffer[offset]
    const second = buffer[offset + 1]
    let length = second & 0x7f
    let position = offset + 2
    if (length === 126) {
      if (position + 2 > buffer.length) break
      length = buffer.readUInt16BE(position)
      position += 2
    }
    if (length === 127) {
      if (position + 8 > buffer.length) break
      const bigLength = buffer.readBigUInt64BE(position)
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Websocket frame is too large.')
      length = Number(bigLength)
      position += 8
    }
    const masked = Boolean(second & 0x80)
    let mask
    if (masked) {
      if (position + 4 > buffer.length) break
      mask = buffer.subarray(position, position + 4)
      position += 4
    }
    if (position + length > buffer.length) break
    const payload = Buffer.from(buffer.subarray(position, position + length))
    if (masked) {
      for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4]
    }
    if ((first & 0x0f) === 1) frames.push(payload.toString())
    offset = position + length
  }
  return { frames, rest: buffer.subarray(offset) }
}

const connect = (webSocketUrl) =>
  new Promise((resolve, reject) => {
    const { hostname, port, pathname } = new URL(webSocketUrl)
    const socket = net.createConnection({ host: hostname, port: Number(port) })
    let handshakeBuffer = Buffer.alloc(0)
    let frameBuffer = Buffer.alloc(0)
    let ready = false
    let id = 0
    const pending = new Map()

    const handleFrame = (frame) => {
      const message = JSON.parse(frame)
      if (!message.id || !pending.has(message.id)) return
      pending.get(message.id).resolve(message)
      pending.delete(message.id)
    }

    socket.on('connect', () => {
      const key = crypto.randomBytes(16).toString('base64')
      socket.write(
        `GET ${pathname} HTTP/1.1\r\nHost: ${hostname}:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
      )
    })

    socket.on('data', (chunk) => {
      if (!ready) {
        handshakeBuffer = Buffer.concat([handshakeBuffer, chunk])
        const end = handshakeBuffer.indexOf('\r\n\r\n')
        if (end === -1) return
        ready = true
        frameBuffer = handshakeBuffer.subarray(end + 4)
        resolve({
          send(method, params = {}) {
            return new Promise((resolveMessage, rejectMessage) => {
              id += 1
              pending.set(id, { resolve: resolveMessage, reject: rejectMessage })
              socket.write(encodeFrame(JSON.stringify({ id, method, params })))
            })
          },
          close() {
            socket.end()
          },
        })
      } else {
        frameBuffer = Buffer.concat([frameBuffer, chunk])
      }
      const decoded = decodeFrames(frameBuffer)
      frameBuffer = decoded.rest
      decoded.frames.forEach(handleFrame)
    })

    socket.on('error', reject)
  })

const targets = await getJson('http://127.0.0.1:9222/json/list')
const target = targets.find((item) => item.type === 'page')
if (!target) throw new Error('No Chrome page target found.')

await fs.mkdir(outputDir, { recursive: true })
const cdp = await connect(target.webSocketDebuggerUrl)
await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })

for (const tab of ['today', 'plan', 'reels', 'review', 'library', 'more']) {
  await cdp.send('Runtime.evaluate', { expression: `localStorage.setItem('twinkle.lastTab','${tab}')` })
  await cdp.send('Page.navigate', { url: `${appUrl}?shot=${tab}` })
  await new Promise((resolve) => setTimeout(resolve, 1800))
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true })
  await fs.writeFile(new URL(`${tab}-mobile.png`, outputDir), Buffer.from(screenshot.result.data, 'base64'))
}

const result = await cdp.send('Runtime.evaluate', {
  expression:
    "JSON.stringify({title:document.title, scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth, hasOld:/Creator Growth Tracker|Twinkle Growth Tracker|Phase 2|Phase 3/.test(document.body.innerText), text:document.body.innerText.slice(0,400)})",
  returnByValue: true,
})

cdp.close()
console.log(result.result.value)
