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
    const parsed = JSON.parse(decodeURIComponent(atob(value))) as Partial<RingConfig>
    if (
      !parsed.metal || !(parsed.metal in metals) ||
      !parsed.stone || !(parsed.stone in stones) ||
      !parsed.cut || !(parsed.cut in cuts) ||
      typeof parsed.carats !== 'number' ||
      parsed.carats < 0.5 || parsed.carats > 3 ||
      typeof parsed.size !== 'number' ||
      parsed.size < 48 || parsed.size > 62 ||
      typeof parsed.engraving !== 'string'
    ) {
      return null
    }
    return { ...defaultConfig, ...parsed, engraving: parsed.engraving.slice(0, 24) }
  } catch {
    return null
  }
}
