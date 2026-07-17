import type {
  CutId,
  MetalId,
  RingConfig,
  RingStyleId,
  StoneDimensionsMm,
  StoneId,
} from '../domain/types'

export type Vec3Mm = [number, number, number]

export type LayoutStone = {
  id: string
  role: 'center' | 'side' | 'halo' | 'pave' | 'eternity'
  stone: StoneId
  cut: CutId
  dimensions: StoneDimensionsMm
  center: Vec3Mm
  rotation: Vec3Mm
}

export type LayoutProng = {
  id: string
  stoneId: string
  start: Vec3Mm
  end: Vec3Mm
  diameterMm: number
  angleDeg: number
  seatRemovalRatio: number
}

export type LayoutGallery = {
  id: string
  stoneId: string
  center: Vec3Mm
  radiusX: number
  radiusZ: number
  wireDiameterMm: number
}

export type LayoutBead = {
  id: string
  stoneId: string
  center: Vec3Mm
  diameterMm: number
  angleDeg: 45 | 135 | 225 | 315
  sharedWithStoneId?: string
  sharedAngleDeg?: 45 | 135 | 225 | 315
}

export type LayoutSeat = {
  id: string
  stoneId: string
  center: Vec3Mm
  rotation: Vec3Mm
  depthMm: number
  topRadiusMm: number
  bottomRadiusMm: number
}

export type LayoutArch = {
  id: string
  stoneId: string
  points: [Vec3Mm, Vec3Mm, Vec3Mm]
  diameterMm: number
}

export type SemanticLayout = {
  config: RingConfig
  style: RingStyleId
  metal: MetalId
  units: 'mm'
  shank: {
    innerRadiusMm: number
    radialThicknessMm: number
    axialWidthMm: number
    castingInnerRadiusMm: number
    castingRadialThicknessMm: number
    sizeBarDegrees: number
  }
  stones: LayoutStone[]
  prongs: LayoutProng[]
  galleries: LayoutGallery[]
  beads: LayoutBead[]
  seats: LayoutSeat[]
  arches: LayoutArch[]
  resizable: boolean
  process: {
    linearShrinkage: number
    finishingAllowanceMm: number
  }
}
