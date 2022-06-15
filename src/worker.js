/* eslint-env worker */

export default {
  async fetch (request, env) {
    const url = new URL(request.url)
    const key = url.pathname.slice(1)

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET' }
      })
    }

    const object = await env.DAGCARGO.get(key)
    if (!object || !object.body) {
      return new Response('Object Not Found', { status: 404 })
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)

    return new Response(object.body, { headers })
  }
}
