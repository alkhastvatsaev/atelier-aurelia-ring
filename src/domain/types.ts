export type MetalId = 'yellow-gold' | 'rose-gold' | 'platinum'
export type StoneId = 'diamond' | 'sapphire' | 'emerald'
export type CutId = 'round' | 'oval' | 'emerald'
export type RingStyleId = 'solitaire' | 'eternity'

export type RingConfig = {
  version: 2
  style: RingStyleId
  metal: MetalId
  stone: StoneId
  cut: CutId
  carats: number
  engraving: string
  size: number
}

export type StoneDimensionsMm = {
  length: number
  width: number
  depth: number
  crownHeight: number
  pavilionDepth: number
  girdleThickness: number
}

export type CastingProfile = {
  id: string
  label: string
  linearShrinkage: number
  finishingAllowanceMm: number
  minimumDetailMm: number
  minimumOpeningMm: number
}

export type AlloyProfile = {
  id: MetalId
  label: string
  color: string
  densityGcm3: number
  price: number
  casting: CastingProfile
  workshopMinimumShankMm: number
}
