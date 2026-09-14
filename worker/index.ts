export interface Env { ROOMS: DurableObjectNamespace; FILES: R2Bucket }

export default { async fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/room/')) { const id = env.ROOMS.idFromName(url.pathname.split('/').pop() || 'default'); return env.ROOMS.get(id).fetch(request) }
  if (url.pathname === '/api/upload' && request.method === 'POST') { const file = await request.arrayBuffer(); const key = crypto.randomUUID(); await env.FILES.put(key, file, { httpMetadata: { contentType: request.headers.get('content-type') || 'application/octet-stream' } }); return Response.json({ key }) }
  if (url.pathname.startsWith('/api/file/')) { const object = await env.FILES.get(url.pathname.split('/').pop() || ''); return object ? new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || 'application/octet-stream' } }) : new Response('File not found', { status: 404 }) }
  return new Response('Not found', { status: 404 })
} }

export class Room { state: DurableObjectState; sessions = new Set<WebSocket>(); constructor(state: DurableObjectState) { this.state = state }
  async fetch(request: Request) { if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket required', { status: 426 }); const pair = new WebSocketPair(); const [client, server] = Object.values(pair); server.accept(); this.sessions.add(server); server.addEventListener('message', event => { for (const peer of this.sessions) if (peer !== server) peer.send(event.data) }); server.addEventListener('close', () => this.sessions.delete(server)); return new Response(null, { status: 101, webSocket: client }) }
}
