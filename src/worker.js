/* eslint-env worker */
import { HttpError } from './errors.js'

export default {
  async fetch (request, env) {
    try {
      const response = await handler(request, env)
      return response
    } catch (err) {
      console.error(err)
      if (err instanceof HttpError) {
        return new Response(err.message, { status: err.status, headers: err.headers })
      }
      return new Response(err.message || 'Server Error', { status: 500 })
    }
  }
}

/**
 * @param {Request} request
 * @param {{ DAGCARGO: any, ROUNDABOUT_API_URL: string, DAGCARGO_BUCKET_NAME: string }} env
 */
async function handler (request, env) {
  const url = new URL(request.url)
  const key = url.pathname.slice(1)

  if (request.method === 'GET') {
    const url = new URL(key, env.ROUNDABOUT_API_URL)
    url.searchParams.set('bucket', env.DAGCARGO_BUCKET_NAME)
    return Response.redirect(url)
  }

  if (request.method === 'HEAD') {
    const object = await env.DAGCARGO.head(key)
    if (!object) throw new HttpError('Object Not Found', { status: 404 })

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('accept-ranges', 'bytes')
    headers.set('content-length', object.size)

    return new Response(undefined, { headers })
  }

  throw new HttpError('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
}
