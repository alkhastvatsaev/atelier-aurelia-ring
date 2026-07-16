import { alloys } from '../domain/materials'
import { euSizeToInnerRadiusMm } from '../domain/ringSizes'
import type { LayoutStone, SemanticLayout } from '../geometry/types'
import type { RuleResult, ValidationReport } from './types'

const SOURCES = {
  cap: 'https://www.francecompetences.fr/recherche/rncp/36336/',
  giaProngs:
    'https://www.gia.edu/articles/bench-tip-avoid-stone-loss-with-quality-assurance-benchmarks',
  giaMelee: 'https://www.gia.edu/design-with-melee',
  stuller:
    'https://assets.stullercloud.com/web/apps/images/kbpdfs/stu7283-cadcamproductionstandards.pdf',
  casting: 'https://www.morrisandwatson.com/casting/cad-design-guidelines',
} as const

function distance3d(first: LayoutStone, second: LayoutStone) {
  return Math.hypot(
    first.center[0] - second.center[0],
    first.center[1] - second.center[1],
    first.center[2] - second.center[2],
  )
}

function radiusInDirection(stone: LayoutStone, dx: number, dz: number) {
  const radiusX = stone.dimensions.length / 2
  const radiusZ = stone.dimensions.width / 2
  const length = Math.hypot(dx, dz)
  if (length < 0.0001) return Math.max(radiusX, radiusZ)
  const x = dx / length
  const z = dz / length
  return 1 / Math.sqrt((x * x) / (radiusX * radiusX) + (z * z) / (radiusZ * radiusZ))
}

function validateStoneCollisions(layout: SemanticLayout): RuleResult[] {
  const results: RuleResult[] = []
  for (let first = 0; first < layout.stones.length; first += 1) {
    for (let second = first + 1; second < layout.stones.length; second += 1) {
      const a = layout.stones[first]
      const b = layout.stones[second]
      const dx = b.center[0] - a.center[0]
      const dz = b.center[2] - a.center[2]
      const measured =
        distance3d(a, b) -
        radiusInDirection(a, dx, dz) -
        radiusInDirection(b, -dx, -dz)
      if (measured < 0.15 - 0.01) {
        results.push({
          code: 'STONE_CLEARANCE',
          severity: 'error',
          title: 'Pierres en collision',
          message: `${a.id} et ${b.id} ne conservent pas les 0,15 mm du profil pavé.`,
          source: SOURCES.stuller,
          entityIds: [a.id, b.id],
          measured,
          required: 0.15,
          unit: 'mm',
        })
      }
    }
  }
  return results
}

function validateProngs(layout: SemanticLayout): RuleResult[] {
  const results: RuleResult[] = []
  for (const prong of layout.prongs) {
    const horizontalRun = Math.hypot(
      prong.end[0] - prong.start[0],
      prong.end[2] - prong.start[2],
    )
    const actualAngle =
      (Math.atan2(Math.abs(prong.end[1] - prong.start[1]), horizontalRun) * 180) /
      Math.PI
    if (prong.diameterMm < 0.45) {
      results.push({
        code: 'PRONG_DIAMETER',
        severity: 'error',
        title: 'Griffe trop fine',
        message: 'Le diamètre fini de la griffe est inférieur au profil de production.',
        source: SOURCES.stuller,
        entityIds: [prong.id, prong.stoneId],
        measured: prong.diameterMm,
        required: 0.45,
        unit: 'mm',
      })
    }
    if (actualAngle < 70 || actualAngle > 80) {
      results.push({
        code: 'PRONG_ANGLE',
        severity: 'error',
        title: 'Angle de griffe incorrect',
        message: 'Une griffe traditionnelle finie doit rester entre 70° et 80°.',
        source: SOURCES.giaProngs,
        entityIds: [prong.id, prong.stoneId],
        measured: actualAngle,
        required: [70, 80],
        unit: 'degrees',
      })
    }
    if (prong.seatRemovalRatio < 0.4 || prong.seatRemovalRatio > 0.5) {
      results.push({
        code: 'PRONG_SEAT',
        severity: 'error',
        title: 'Siège de griffe incorrect',
        message: 'Le siège fini doit retirer 40 à 50 % de l’épaisseur de griffe.',
        source: SOURCES.giaProngs,
        entityIds: [prong.id, prong.stoneId],
        measured: prong.seatRemovalRatio,
        required: [0.4, 0.5],
        unit: 'ratio',
      })
    }
  }
  return results
}

function validateGalleries(layout: SemanticLayout): RuleResult[] {
  const results: RuleResult[] = []
  for (const gallery of layout.galleries) {
    const stone = layout.stones.find((candidate) => candidate.id === gallery.stoneId)
    if (!stone) continue
    const culetY = stone.center[1] - stone.dimensions.pavilionDepth
    const clearance = gallery.center[1] - culetY
    if (clearance < 0.5 - 0.01) {
      results.push({
        code: 'CULET_GALLERY_CLEARANCE',
        severity: 'error',
        title: 'Culet trop proche de la galerie',
        message: 'Le profil retenu exige 0,50 mm entre culet et rail.',
        source: SOURCES.stuller,
        entityIds: [stone.id, gallery.id],
        measured: clearance,
        required: 0.5,
        unit: 'mm',
      })
    }
    if (gallery.wireDiameterMm < 0.4) {
      results.push({
        code: 'GALLERY_WIRE',
        severity: 'error',
        title: 'Fil de galerie trop fin',
        message: 'Le détail fini est inférieur à 0,40 mm.',
        source: SOURCES.stuller,
        entityIds: [gallery.id],
        measured: gallery.wireDiameterMm,
        required: 0.4,
        unit: 'mm',
      })
    }
  }
  return results
}

function validatePaveBorder(layout: SemanticLayout): RuleResult[] {
  const pave = layout.stones.filter(
    (stone) => stone.role === 'pave' || stone.role === 'eternity',
  )
  if (pave.length === 0) return []
  const largest = Math.max(...pave.map((stone) => stone.dimensions.width))
  const border = (layout.shank.axialWidthMm - largest) / 2
  if (border >= 0.5 - 0.01) return []
  return [
    {
      code: 'PAVE_BORDER',
      severity: 'warning',
      title: 'Bord structurel pavé',
      message: 'La bordure est inférieure au critère GIA de 0,50 mm.',
      source: SOURCES.giaMelee,
      entityIds: pave.map((stone) => stone.id),
      measured: border,
      required: 0.5,
      unit: 'mm',
    },
  ]
}

export function validateDesign(layout: SemanticLayout): ValidationReport {
  const alloy = alloys[layout.metal]
  const results: RuleResult[] = []
  const expectedRadius = euSizeToInnerRadiusMm(layout.config.size)

  if (Math.abs(layout.shank.innerRadiusMm - expectedRadius) > 0.001) {
    results.push({
      code: 'ISO_RING_SIZE',
      severity: 'error',
      title: 'Taille intérieure incorrecte',
      message: 'La circonférence EU ne correspond pas au diamètre intérieur.',
      source: SOURCES.cap,
      entityIds: ['shank'],
      measured: layout.shank.innerRadiusMm,
      required: expectedRadius,
      unit: 'mm',
    })
  }
  if (layout.shank.radialThicknessMm < alloy.workshopMinimumShankMm) {
    results.push({
      code: 'WORKSHOP_SHANK',
      severity: 'warning',
      title: 'Corps de bague à confirmer',
      message: 'Seuil d’atelier conservateur, à valider par le fabricant.',
      source: SOURCES.cap,
      entityIds: ['shank'],
      measured: layout.shank.radialThicknessMm,
      required: alloy.workshopMinimumShankMm,
      unit: 'mm',
    })
  }
  if (
    layout.shank.castingRadialThicknessMm - layout.shank.radialThicknessMm <
    alloy.casting.finishingAllowanceMm
  ) {
    results.push({
      code: 'CASTING_ALLOWANCE',
      severity: 'error',
      title: 'Surcote de fonte insuffisante',
      message: 'La compensation retrait et finition ne couvre pas le profil du fondeur.',
      source: SOURCES.casting,
      entityIds: ['shank'],
      measured:
        layout.shank.castingRadialThicknessMm - layout.shank.radialThicknessMm,
      required: alloy.casting.finishingAllowanceMm,
      unit: 'mm',
    })
  }
  if (!layout.resizable) {
    results.push({
      code: 'NO_RESIZING',
      severity: 'info',
      title: 'Mise à taille indisponible',
      message: 'Une alliance tour complet doit être fabriquée directement à la bonne taille.',
      source: SOURCES.cap,
      entityIds: ['shank'],
    })
  }
  if (layout.config.stone === 'emerald' && layout.style === 'eternity') {
    results.push({
      code: 'STONE_DURABILITY',
      severity: 'warning',
      title: 'Pierre fragile sous pression',
      message: 'Une émeraude tour complet exige une validation pierre par pierre.',
      source: 'https://4cs.gia.edu/en-us/blog/more-than-mohs-scale-gem-durability/',
      entityIds: layout.stones.map((stone) => stone.id),
    })
  }

  results.push(
    ...validateStoneCollisions(layout),
    ...validateProngs(layout),
    ...validateGalleries(layout),
    ...validatePaveBorder(layout),
  )

  const errors = results.filter((result) => result.severity === 'error').length
  const warnings = results.filter((result) => result.severity === 'warning').length
  return {
    status: errors > 0 ? 'impossible' : warnings > 0 ? 'review' : 'conform',
    results,
    errors,
    warnings,
  }
}
