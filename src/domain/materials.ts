import type { AlloyProfile, MetalId } from './types'

export const alloys: Record<MetalId, AlloyProfile> = {
  'yellow-gold': {
    id: 'yellow-gold',
    label: 'Or jaune 18k',
    color: '#d7ad55',
    densityGcm3: 15.6,
    price: 680,
    casting: {
      id: 'direct-cast-gold',
      label: 'Fonte directe or',
      linearShrinkage: 0.01,
      finishingAllowanceMm: 0.15,
      minimumDetailMm: 0.4,
      minimumOpeningMm: 0.4,
    },
    workshopMinimumShankMm: 1.6,
  },
  'rose-gold': {
    id: 'rose-gold',
    label: 'Or rose 18k',
    color: '#c98f79',
    densityGcm3: 15.2,
    price: 720,
    casting: {
      id: 'direct-cast-rose-gold',
      label: 'Fonte directe or rose',
      linearShrinkage: 0.01,
      finishingAllowanceMm: 0.15,
      minimumDetailMm: 0.4,
      minimumOpeningMm: 0.4,
    },
    workshopMinimumShankMm: 1.65,
  },
  platinum: {
    id: 'platinum',
    label: 'Platine 950',
    color: '#d8d9d4',
    densityGcm3: 20.7,
    price: 980,
    casting: {
      id: 'direct-cast-platinum',
      label: 'Fonte directe platine',
      linearShrinkage: 0.02,
      finishingAllowanceMm: 0.2,
      minimumDetailMm: 0.5,
      minimumOpeningMm: 0.4,
    },
    workshopMinimumShankMm: 1.8,
  },
}

export function compensateForCasting(finalMm: number, metal: MetalId) {
  const profile = alloys[metal].casting
  return (finalMm + profile.finishingAllowanceMm) / (1 - profile.linearShrinkage)
}
