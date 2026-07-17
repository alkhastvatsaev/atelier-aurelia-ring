import { describe, expect, it } from 'vitest'
import {
  decodeConfig,
  defaultConfig,
  encodeConfig,
  parseConfig,
  ringPrice,
} from './config'

describe('ring configuration', () => {
  it('round-trips a shareable configuration', () => {
    expect(decodeConfig(encodeConfig(defaultConfig))).toEqual(defaultConfig)
  })

  it('rejects malformed and unsupported shared values', () => {
    expect(decodeConfig('not-base64')).toBeNull()
    expect(parseConfig({ ...defaultConfig, metal: 'silver' })).toBeNull()
    expect(parseConfig({ ...defaultConfig, size: 49 })).toBeNull()
    expect(parseConfig({ ...defaultConfig, carats: Number.NaN })).toBeNull()
  })

  it('limits untrusted engraving text to the product maximum', () => {
    const parsed = parseConfig({ ...defaultConfig, engraving: 'x'.repeat(50) })
    expect(parsed?.engraving).toHaveLength(24)
  })

  it('calculates the catalogue price deterministically', () => {
    expect(ringPrice({ ...defaultConfig, engraving: '' })).toBe(3020)
    expect(ringPrice(defaultConfig)).toBe(3110)
  })
})
