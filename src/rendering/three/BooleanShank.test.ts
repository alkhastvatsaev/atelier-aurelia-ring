import { describe, expect, it } from 'vitest'
import { defaultConfig } from '../../config'
import { buildSemanticLayout } from '../../geometry/buildLayout'
import { createBooleanShankGeometry } from './booleanShankGeometry'

describe('boolean pave seats', () => {
  it('subtracts every semantic seat from the metal shank', () => {
    const layout = buildSemanticLayout(defaultConfig)
    const geometry = createBooleanShankGeometry(layout)

    expect(layout.seats.length).toBeGreaterThan(0)
    expect(geometry.userData.booleanSeatCount).toBe(layout.seats.length)
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0)
    expect(geometry.boundingBox).not.toBeNull()
    geometry.dispose()
  })

  it('creates one calibrated seat for every eternity stone', () => {
    const layout = buildSemanticLayout({ ...defaultConfig, style: 'eternity' })
    expect(layout.seats).toHaveLength(layout.stones.length)
    expect(
      layout.seats.every((seat) =>
        layout.stones.some((stone) => stone.id === seat.stoneId),
      ),
    ).toBe(true)
  })
})
