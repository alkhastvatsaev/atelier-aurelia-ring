import { describe, expect, it } from 'vitest'
import {
  defaultConfig,
  migrateConfig,
  type CutId,
  type RingStyleId,
  type StoneId,
} from '../config'
import { compensateForCasting } from '../domain/materials'
import {
  euSizeToInnerDiameterMm,
  innerDiameterMmToEuSize,
} from '../domain/ringSizes'
import { validateDesign } from '../validation/validateDesign'
import { buildRingDesign } from './buildDesign'

const styles: RingStyleId[] = ['solitaire', 'halo', 'three-stone', 'eternity']
const cuts: CutId[] = ['round', 'oval', 'emerald']
const stones: StoneId[] = ['diamond', 'sapphire', 'emerald']

describe('millimeter jewelry engine', () => {
  it('converts EU circumference sizes without approximation', () => {
    for (const size of [48, 50, 54, 58, 62]) {
      expect(innerDiameterMmToEuSize(euSizeToInnerDiameterMm(size))).toBeCloseTo(size, 10)
    }
  })

  it('migrates version 1 shared configurations', () => {
    const migrated = migrateConfig({
      metal: 'rose-gold',
      stone: 'sapphire',
      cut: 'round',
      carats: 1,
      size: 52,
      engraving: 'Toujours',
    })
    expect(migrated.version).toBe(2)
    expect(migrated.style).toBe('solitaire')
    expect(migrated.metal).toBe('rose-gold')
  })

  it('builds every supported family with unique semantic entities', () => {
    for (const style of styles) {
      const design = buildRingDesign({ ...defaultConfig, style })
      const ids = [
        ...design.layout.stones.map((entity) => entity.id),
        ...design.layout.prongs.map((entity) => entity.id),
        ...design.layout.galleries.map((entity) => entity.id),
        ...design.layout.beads.map((entity) => entity.id),
      ]
      expect(new Set(ids).size).toBe(ids.length)
      expect(design.layout.units).toBe('mm')
      expect(design.layout.stones.length).toBeGreaterThan(0)
      const stoneIds = new Set(design.layout.stones.map((stone) => stone.id))
      expect(design.layout.prongs.every((prong) => stoneIds.has(prong.stoneId))).toBe(true)
      expect(design.layout.galleries.every((gallery) => stoneIds.has(gallery.stoneId))).toBe(true)
    }
  })

  it('keeps the four style reference structures stable', () => {
    const solitaire = buildRingDesign({ ...defaultConfig, style: 'solitaire', cut: 'round' })
    const halo = buildRingDesign({ ...defaultConfig, style: 'halo' })
    const trilogy = buildRingDesign({ ...defaultConfig, style: 'three-stone' })
    const eternity = buildRingDesign({ ...defaultConfig, style: 'eternity' })

    expect(solitaire.layout.prongs).toHaveLength(6)
    expect(solitaire.layout.galleries).toHaveLength(1)
    expect(halo.layout.stones.filter((stone) => stone.role === 'halo').length).toBeGreaterThan(7)
    expect(trilogy.layout.stones.filter((stone) => stone.role === 'side')).toHaveLength(2)
    expect(trilogy.layout.galleries).toHaveLength(3)
    expect(eternity.layout.stones.every((stone) => stone.role === 'eternity')).toBe(true)
    expect(eternity.layout.resizable).toBe(false)
    expect(eternity.layout.shank.sizeBarDegrees).toBe(0)

    for (const design of [solitaire, eternity]) {
      const paveStones = design.layout.stones.filter(
        (stone) => stone.role === 'pave' || stone.role === 'eternity',
      )
      for (const stone of paveStones) {
        const prongs = design.layout.beads.filter((bead) => bead.stoneId === stone.id)
        expect(prongs).toHaveLength(4)
        expect(prongs.map((prong) => prong.angleDeg).sort((a, b) => a - b)).toEqual([
          45,
          135,
          225,
          315,
        ])
      }
    }
  })

  it('keeps the supported configuration grid free of hard errors', () => {
    for (const style of styles) {
      for (const cut of cuts) {
        for (const stone of stones) {
          for (const size of [48, 54, 62]) {
            for (const carats of [0.5, 1.2, 3]) {
              const design = buildRingDesign({
                ...defaultConfig,
                style,
                cut,
                stone,
                size,
                carats,
              })
              expect(
                design.report.errors,
                `${style}/${cut}/${stone}/${size}/${carats}`,
              ).toBe(0)
            }
          }
        }
      }
    }
  })

  it('detects deliberately invalid prongs and stone collisions', () => {
    const design = buildRingDesign(defaultConfig)
    const invalid = structuredClone(design.layout)
    invalid.prongs[0].diameterMm = 0.3
    invalid.prongs[0].end[0] += 10
    invalid.stones[1].center = [...invalid.stones[0].center]
    invalid.beads = invalid.beads.slice(1)
    const report = validateDesign(invalid)

    expect(report.status).toBe('impossible')
    expect(report.results.some((result) => result.code === 'PRONG_DIAMETER')).toBe(true)
    expect(report.results.some((result) => result.code === 'PRONG_ANGLE')).toBe(true)
    expect(report.results.some((result) => result.code === 'STONE_CLEARANCE')).toBe(true)
    expect(report.results.some((result) => result.code === 'PAVE_FOUR_PRONGS')).toBe(true)
  })

  it('adds alloy-specific shrinkage and finishing allowance', () => {
    expect(compensateForCasting(2, 'yellow-gold')).toBeGreaterThan(2.15)
    expect(compensateForCasting(2, 'platinum')).toBeGreaterThan(
      compensateForCasting(2, 'yellow-gold'),
    )
  })
})
