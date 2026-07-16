import { alloys } from './materials'
import { gemstones } from './gemstones'
import type { CutId, RingConfig, RingStyleId, StoneId } from './types'

export const cuts: Record<CutId, { label: string; multiplier: number }> = {
  round: { label: 'Brillant', multiplier: 1 },
  oval: { label: 'Ovale', multiplier: 1.08 },
  emerald: { label: 'Émeraude', multiplier: 1.12 },
}

export const ringStyles: Record<RingStyleId, { label: string; shortLabel: string }> = {
  solitaire: { label: 'Solitaire pavé', shortLabel: 'Solitaire' },
  halo: { label: 'Halo', shortLabel: 'Halo' },
  'three-stone': { label: 'Trois pierres', shortLabel: 'Trilogie' },
  eternity: { label: 'Alliance tour complet', shortLabel: 'Éternité' },
}

export const defaultConfig: RingConfig = {
  version: 2,
  style: 'solitaire',
  metal: 'yellow-gold',
  stone: 'diamond',
  cut: 'oval',
  carats: 1.2,
  engraving: 'À TOI, TOUJOURS',
  size: 54,
}

export function ringPrice(config: RingConfig) {
  const stonePrice =
    gemstones[config.stone].price * config.carats * cuts[config.cut].multiplier
  const styleMultiplier =
    config.style === 'halo' ? 1.28 : config.style === 'three-stone' ? 1.42 : config.style === 'eternity' ? 1.55 : 1
  const engravingPrice = config.engraving.trim() ? 90 : 0
  return Math.round(alloys[config.metal].price + stonePrice * styleMultiplier + engravingPrice)
}

export function encodeConfig(config: RingConfig) {
  return btoa(encodeURIComponent(JSON.stringify(config)))
}

function isStyle(value: unknown): value is RingStyleId {
  return typeof value === 'string' && value in ringStyles
}

function isStone(value: unknown): value is StoneId {
  return typeof value === 'string' && value in gemstones
}

function isCut(value: unknown): value is CutId {
  return typeof value === 'string' && value in cuts
}

export function parseConfig(value: unknown): RingConfig | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as Partial<RingConfig>
  if (
    typeof parsed.metal !== 'string' ||
    !(parsed.metal in alloys) ||
    !isStone(parsed.stone) ||
    !isCut(parsed.cut) ||
    typeof parsed.carats !== 'number' ||
    !Number.isFinite(parsed.carats) ||
    parsed.carats < 0.5 ||
    parsed.carats > 3 ||
    typeof parsed.size !== 'number' ||
    ![48, 50, 52, 54, 56, 58, 60, 62].includes(parsed.size) ||
    typeof parsed.engraving !== 'string' ||
    (parsed.style !== undefined && !isStyle(parsed.style))
  ) {
    return null
  }
  return migrateConfig(parsed)
}

export function migrateConfig(value: unknown): RingConfig {
  const parsed = value && typeof value === 'object' ? (value as Partial<RingConfig>) : {}
  return {
    ...defaultConfig,
    ...parsed,
    version: 2,
    style: isStyle(parsed.style) ? parsed.style : defaultConfig.style,
    metal:
      typeof parsed.metal === 'string' && parsed.metal in alloys
        ? (parsed.metal as RingConfig['metal'])
        : defaultConfig.metal,
    stone: isStone(parsed.stone) ? parsed.stone : defaultConfig.stone,
    cut: isCut(parsed.cut) ? parsed.cut : defaultConfig.cut,
    carats:
      typeof parsed.carats === 'number' && parsed.carats >= 0.5 && parsed.carats <= 3
        ? parsed.carats
        : defaultConfig.carats,
    size:
      typeof parsed.size === 'number' && parsed.size >= 48 && parsed.size <= 62
        ? parsed.size
        : defaultConfig.size,
    engraving:
      typeof parsed.engraving === 'string'
        ? parsed.engraving.slice(0, 24)
        : defaultConfig.engraving,
  }
}

export function decodeConfig(value: string | null): RingConfig | null {
  if (!value) return null
  try {
    return parseConfig(JSON.parse(decodeURIComponent(atob(value))))
  } catch {
    return null
  }
}
