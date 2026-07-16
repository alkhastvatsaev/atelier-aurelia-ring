export type MetalId = 'yellow-gold' | 'rose-gold' | 'platinum'
export type StoneId = 'diamond' | 'sapphire' | 'emerald'
export type CutId = 'round' | 'oval' | 'emerald'

export type RingConfig = {
  metal: MetalId
  stone: StoneId
  cut: CutId
  carats: number
  engraving: string
  size: number
}

export const metals = {
  'yellow-gold': { label: 'Or jaune 18k', color: '#d7ad55', price: 680 },
  'rose-gold': { label: 'Or rose 18k', color: '#c98f79', price: 720 },
  platinum: { label: 'Platine 950', color: '#d8d9d4', price: 980 },
} as const

export const stones = {
  diamond: { label: 'Diamant', color: '#f3fbff', price: 1950 },
  sapphire: { label: 'Saphir bleu', color: '#174ca3', price: 1150 },
  emerald: { label: 'Émeraude', color: '#087b57', price: 1320 },
} as const

export const cuts = {
  round: { label: 'Brillant', multiplier: 1 },
  oval: { label: 'Ovale', multiplier: 1.08 },
  emerald: { label: 'Émeraude', multiplier: 1.12 },
} as const

export const defaultConfig: RingConfig = {
  metal: 'yellow-gold',
  stone: 'diamond',
  cut: 'oval',
  carats: 1.2,
  engraving: 'À TOI, TOUJOURS',
  size: 54,
}

const ringSizes = [48, 50, 52, 54, 56, 58, 60, 62]

function isRingConfig(value: unknown): value is RingConfig {
  if (!value || typeof value !== 'object') return false

  const config = value as Partial<RingConfig>
  return (
    typeof config.metal === 'string' &&
    config.metal in metals &&
    typeof config.stone === 'string' &&
    config.stone in stones &&
    typeof config.cut === 'string' &&
    config.cut in cuts &&
    typeof config.carats === 'number' &&
    Number.isFinite(config.carats) &&
    config.carats >= 0.5 &&
    config.carats <= 3 &&
    typeof config.size === 'number' &&
    ringSizes.includes(config.size) &&
    typeof config.engraving === 'string'
  )
}

export function parseConfig(value: unknown): RingConfig | null {
  if (!isRingConfig(value)) return null
  return { ...value, engraving: value.engraving.slice(0, 24) }
}

export function ringPrice(config: RingConfig) {
  const stonePrice = stones[config.stone].price * config.carats * cuts[config.cut].multiplier
  const engravingPrice = config.engraving.trim() ? 90 : 0
  return Math.round(metals[config.metal].price + stonePrice + engravingPrice)
}

export function encodeConfig(config: RingConfig) {
  return btoa(encodeURIComponent(JSON.stringify(config)))
}

export function decodeConfig(value: string | null): RingConfig | null {
  if (!value) return null

  try {
    return parseConfig(JSON.parse(decodeURIComponent(atob(value))))
  } catch {
    return null
  }
}
