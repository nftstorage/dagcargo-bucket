import parseRange from 'http-range-parse'

/** @typedef {{ offset: number, length?: number } | { offset?: number, length: number } | { suffix: number }} R2Range */

/**
 * Convert a HTTP Range header to an R2 range object.
 * @param {string} value
 * @returns {R2Range}
 */
export function toR2Range (value) {
  const result = parseRange(value)
  if (result.ranges) throw new Error('Multiple ranges not supported')
  const { unit, first, last, suffix } = result
  if (unit !== 'bytes') throw new Error(`Unsupported range unit: ${unit}`)
  return suffix != null
    ? { suffix }
    : { offset: first, length: last != null ? last - first + 1 : undefined }
}
