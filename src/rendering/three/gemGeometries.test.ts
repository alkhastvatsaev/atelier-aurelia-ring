import { describe, expect, it } from 'vitest'
import { estimateStoneDimensions } from '../../domain/gemstones'
import type { CutId } from '../../domain/types'
import { createGemGeometry, FACET_SPECIFICATIONS } from './gemGeometries'

describe('gemological faceting', () => {
  it.each([
    ['round', 58],
    ['oval', 58],
    ['emerald', 57],
  ] satisfies [CutId, number][])('builds %s with %i logical facets', (cut, count) => {
    const dimensions = estimateStoneDimensions('diamond', cut, 1)
    const geometry = createGemGeometry(cut, dimensions)

    expect(geometry.userData.logicalFacetCount).toBe(count)
    expect(FACET_SPECIFICATIONS[cut].facetCount).toBe(count)
    expect(geometry.getAttribute('normal').count).toBe(
      geometry.getAttribute('position').count,
    )
    expect(geometry.boundingBox).not.toBeNull()
    expect(geometry.boundingSphere).not.toBeNull()
  })

  it('uses the canonical 58-facet brilliant families', () => {
    const geometry = createGemGeometry(
      'round',
      estimateStoneDimensions('diamond', 'round', 1),
    )

    expect(geometry.userData.facetFamilies).toEqual({
      table: 1,
      star: 8,
      bezel: 8,
      'upper-girdle': 16,
      'lower-girdle': 16,
      'pavilion-main': 8,
      culet: 1,
    })
  })

  it('uses three crown and three pavilion steps for emerald cut', () => {
    const geometry = createGemGeometry(
      'emerald',
      estimateStoneDimensions('emerald', 'emerald', 1),
    )

    expect(geometry.userData.facetFamilies).toEqual({
      table: 1,
      'crown-step': 24,
      girdle: 8,
      'pavilion-step': 24,
    })
  })
})
