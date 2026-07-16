import { describe, expect, it } from 'vitest'
import { defaultConfig, type CutId } from './config'
import { calculateJewelryLayout } from './jewelryLayout'

const cuts: CutId[] = ['round', 'oval', 'emerald']
const sizes = [48, 50, 52, 54, 56, 58, 60, 62]
const carats = Array.from({ length: 26 }, (_, index) => 0.5 + index * 0.1)

describe('jewelry collision layout', () => {
  it('keeps every supported size, cut and carat combination collision-free', () => {
    for (const cut of cuts) {
      for (const size of sizes) {
        for (const carat of carats) {
          const layout = calculateJewelryLayout({
            ...defaultConfig,
            cut,
            size,
            carats: carat,
          })

          expect(
            layout.collisions,
            `${cut}, taille ${size}, ${carat.toFixed(1)} ct`,
          ).toEqual([])
        }
      }
    }
  })

  it('raises the setting and removes nearby pavé stones as the center grows', () => {
    const small = calculateJewelryLayout({ ...defaultConfig, carats: 0.5 })
    const large = calculateJewelryLayout({ ...defaultConfig, carats: 3 })

    expect(large.centerY).toBeGreaterThan(small.centerY)
    expect(large.basketRadius).toBeGreaterThan(small.basketRadius)
    expect(large.paveAngles.length).toBeLessThanOrEqual(small.paveAngles.length)
  })

  it('uses four corner prongs for emerald cuts and six for brilliant cuts', () => {
    expect(calculateJewelryLayout({ ...defaultConfig, cut: 'emerald' }).prongCount).toBe(4)
    expect(calculateJewelryLayout({ ...defaultConfig, cut: 'round' }).prongCount).toBe(6)
  })
})
