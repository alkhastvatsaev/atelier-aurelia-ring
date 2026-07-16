import { alloys, compensateForCasting } from '../domain/materials'
import { euSizeToInnerRadiusMm } from '../domain/ringSizes'
import type { RingConfig } from '../domain/types'
import { styleRecipes } from '../styles/registry'
import type { SemanticLayout } from './types'

export function buildSemanticLayout(config: RingConfig): SemanticLayout {
  const innerRadiusMm = euSizeToInnerRadiusMm(config.size)
  const recipe = styleRecipes[config.style]({ config, innerRadiusMm })
  const alloy = alloys[config.metal]

  return {
    config,
    style: config.style,
    metal: config.metal,
    units: 'mm',
    shank: {
      innerRadiusMm,
      radialThicknessMm: recipe.radialThicknessMm,
      axialWidthMm: recipe.axialWidthMm,
      castingInnerRadiusMm: innerRadiusMm / (1 - alloy.casting.linearShrinkage),
      castingRadialThicknessMm: compensateForCasting(
        recipe.radialThicknessMm,
        config.metal,
      ),
      sizeBarDegrees: recipe.sizeBarDegrees,
    },
    stones: recipe.stones,
    prongs: recipe.prongs,
    galleries: recipe.galleries,
    beads: recipe.beads,
    resizable: recipe.resizable,
    process: {
      linearShrinkage: alloy.casting.linearShrinkage,
      finishingAllowanceMm: alloy.casting.finishingAllowanceMm,
    },
  }
}
