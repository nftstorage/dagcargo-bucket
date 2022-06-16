export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {ErrorOptions & { status?: number, headers?: Record<string, string> }} [options]
   */
  constructor (message, options) {
    super(message, options)
    this.status = options?.status ?? 500
    this.headers = options?.headers
  }
}
