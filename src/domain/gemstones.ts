import type { CutId, StoneDimensionsMm, StoneId } from './types'

export const gemstones = {
  diamond: {
    label: 'Diamant',
    color: '#f3fbff',
    density: 3.52,
    price: 1950,
    ior: 2.417,
    dispersion: 0.044,
    abbe: 55,
  },
  sapphire: {
    label: 'Saphir bleu',
    color: '#174ca3',
    density: 4,
    price: 1150,
    ior: 1.77,
    dispersion: 0.018,
    abbe: 72,
  },
  emerald: {
    label: 'Émeraude',
    color: '#087b57',
    density: 2.76,
    price: 1320,
    ior: 1.58,
    dispersion: 0.014,
    abbe: 80,
  },
} as const

const ONE_CARAT: Record<CutId, StoneDimensionsMm> = {
  round: {
    length: 6.5,
    width: 6.5,
    depth: 3.96,
    crownHeight: 1.05,
    pavilionDepth: 2.79,
    girdleThickness: 0.12,
  },
  oval: {
    length: 8,
    width: 6,
    depth: 3.7,
    crownHeight: 0.95,
    pavilionDepth: 2.62,
    girdleThickness: 0.13,
  },
  emerald: {
    length: 7,
    width: 5,
    depth: 3.35,
    crownHeight: 0.72,
    pavilionDepth: 2.48,
    girdleThickness: 0.15,
  },
}

export function estimateStoneDimensions(
  stone: StoneId,
  cut: CutId,
  carats: number,
): StoneDimensionsMm {
  const base = ONE_CARAT[cut]
  const densityCorrection = Math.cbrt(gemstones.diamond.density / gemstones[stone].density)
  const weightScale = Math.cbrt(carats)
  const scale = densityCorrection * weightScale

  return {
    length: base.length * scale,
    width: base.width * scale,
    depth: base.depth * scale,
    crownHeight: base.crownHeight * scale,
    pavilionDepth: base.pavilionDepth * scale,
    girdleThickness: Math.max(0.1, base.girdleThickness * scale),
  }
}
