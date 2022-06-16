/* eslint-env worker */
import { HttpError } from './errors.js'
import { toR2Range } from './r2.js'

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
 * @param {{ DAGCARGO: any }} env
 */
async function handler (request, env) {
  const url = new URL(request.url)
  const key = url.pathname.slice(1)

  if (request.method === 'GET') {
    /** @type {import('./r2').R2Range|undefined} */
    let range
    if (request.headers.has('range')) {
      try {
        range = toR2Range(request.headers.get('range'))
      } catch (err) {
        throw new HttpError('Invalid Range', { status: 400, cause: err })
      }
    }

    const object = await env.DAGCARGO.get(key, { range })
    if (!object || !object.body) {
      throw new HttpError('Object Not Found', { status: 404 })
    }

    const status = range ? 206 : 200
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)

    if (range) {
      let first, last
      if (range.suffix != null) {
        first = object.size - range.suffix
        last = object.size - 1
      } else {
        first = range.offset || 0
        last = range.length != null ? first + range.length - 1 : object.size - 1
      }
      headers.set('content-range', `bytes ${first}-${last}/${object.size}`)
      headers.set('content-length', last - first + 1)
    } else {
      headers.set('content-length', object.size)
    }

    return new Response(object.body, { headers, status })
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
