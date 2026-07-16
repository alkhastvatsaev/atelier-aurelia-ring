import { estimateStoneDimensions } from '../domain/gemstones'
import type { RingConfig, StoneDimensionsMm } from '../domain/types'
import type {
  LayoutBead,
  LayoutGallery,
  LayoutProng,
  LayoutStone,
  Vec3Mm,
} from '../geometry/types'

const PRONG_ANGLE_RADIANS = (75 * Math.PI) / 180

export type StyleGeometry = {
  stones: LayoutStone[]
  prongs: LayoutProng[]
  galleries: LayoutGallery[]
  beads: LayoutBead[]
  radialThicknessMm: number
  axialWidthMm: number
  sizeBarDegrees: number
  resizable: boolean
}

type RecipeContext = {
  config: RingConfig
  innerRadiusMm: number
}

function scaledDimensions(dimensions: StoneDimensionsMm, scale: number): StoneDimensionsMm {
  return {
    length: dimensions.length * scale,
    width: dimensions.width * scale,
    depth: dimensions.depth * scale,
    crownHeight: dimensions.crownHeight * scale,
    pavilionDepth: dimensions.pavilionDepth * scale,
    girdleThickness: dimensions.girdleThickness * scale,
  }
}

function stoneSetting(
  stone: LayoutStone,
  prongCount: number,
): { prongs: LayoutProng[]; gallery: LayoutGallery } {
  const halfX = stone.dimensions.length / 2
  const halfZ = stone.dimensions.width / 2
  const culetY = stone.center[1] - stone.dimensions.pavilionDepth
  const galleryY = culetY + 0.5
  const prongs = Array.from({ length: prongCount }, (_, index) => {
    const angle = Math.PI / 4 + (index / prongCount) * Math.PI * 2
    const x = Math.cos(angle)
    const z = Math.sin(angle)
    const endY = stone.center[1] + stone.dimensions.crownHeight * 0.78
    const startY = galleryY - 0.35
    const endX = x * (halfX + 0.16)
    const endZ = z * (halfZ + 0.16)
    const endRadius = Math.hypot(endX, endZ)
    const horizontalRun = (endY - startY) / Math.tan(PRONG_ANGLE_RADIANS)
    const startFactor = Math.max(0.2, (endRadius - horizontalRun) / endRadius)
    const start: Vec3Mm = [
      stone.center[0] + endX * startFactor,
      startY,
      stone.center[2] + endZ * startFactor,
    ]
    const end: Vec3Mm = [
      stone.center[0] + endX,
      endY,
      stone.center[2] + endZ,
    ]
    return {
      id: `${stone.id}-prong-${index}`,
      stoneId: stone.id,
      start,
      end,
      diameterMm: 0.55,
      angleDeg: 75,
      seatRemovalRatio: 0.45,
    }
  })

  return {
    prongs,
    gallery: {
      id: `${stone.id}-gallery`,
      stoneId: stone.id,
      center: [stone.center[0], galleryY, stone.center[2]],
      radiusX: Math.max(0.8, halfX * 0.76),
      radiusZ: Math.max(0.7, halfZ * 0.76),
      wireDiameterMm: 0.5,
    },
  }
}

function fourPaveProngs(
  stone: LayoutStone,
  radialAngle: number,
): LayoutBead[] {
  const diameterMm = 0.5
  const offset = stone.dimensions.width * 0.475
  const radialLift = stone.dimensions.crownHeight * 0.28
  const radialX = Math.cos(radialAngle)
  const radialY = Math.sin(radialAngle)
  const tangentX = -radialY
  const tangentY = radialX
  const angles = [45, 135, 225, 315] as const

  return angles.map((angleDeg) => {
    const angle = (angleDeg * Math.PI) / 180
    const tangentOffset = Math.cos(angle) * offset
    const axialOffset = Math.sin(angle) * offset
    return {
      id: `${stone.id}-prong-${angleDeg}`,
      stoneId: stone.id,
      center: [
        stone.center[0] + radialX * radialLift + tangentX * tangentOffset,
        stone.center[1] + radialY * radialLift + tangentY * tangentOffset,
        stone.center[2] + axialOffset,
      ],
      diameterMm,
      angleDeg,
    }
  })
}

function makePaveShoulders(
  outerRadius: number,
  exclusionHalfAngle: number,
) {
  const dimensions = scaledDimensions(
    estimateStoneDimensions('diamond', 'round', 0.01),
    1,
  )
  const stoneRadius = dimensions.width / 2
  const orbit = outerRadius + stoneRadius - 0.12
  const pitch = dimensions.width + 0.15
  const step = 2 * Math.asin(pitch / (2 * orbit))
  const stones: LayoutStone[] = []
  const beads: LayoutBead[] = []

  let index = 0
  for (let angle = 0.52; angle < Math.PI / 2 - exclusionHalfAngle; angle += step) {
    for (const mirrored of [angle, Math.PI - angle]) {
      const center: Vec3Mm = [
        Math.cos(mirrored) * orbit,
        Math.sin(mirrored) * orbit,
        0,
      ]
      const stone: LayoutStone = {
        id: `pave-${index}`,
        role: 'pave',
        stone: 'diamond',
        cut: 'round',
        dimensions,
        center,
        rotation: [0, 0, mirrored - Math.PI / 2],
      }
      stones.push(stone)
      beads.push(...fourPaveProngs(stone, mirrored))
      index += 1
    }
  }

  return { stones, beads }
}

function solitaireRecipe({ config, innerRadiusMm }: RecipeContext): StyleGeometry {
  const radialThicknessMm = 1.8
  const axialWidthMm = 2.4
  const outerRadius = innerRadiusMm + radialThicknessMm
  const dimensions = estimateStoneDimensions(config.stone, config.cut, config.carats)
  const center: LayoutStone = {
    id: 'center',
    role: 'center',
    stone: config.stone,
    cut: config.cut,
    dimensions,
    center: [0, outerRadius + dimensions.pavilionDepth + 0.55, 0],
    rotation: [0, 0, 0],
  }
  const setting = stoneSetting(center, config.cut === 'emerald' ? 4 : 6)
  const headHalfAngle = Math.min(
    0.74,
    Math.asin(Math.min(0.95, (dimensions.length / 2 + 0.8) / (outerRadius + 0.8))),
  )
  const pave = makePaveShoulders(outerRadius, headHalfAngle)

  return {
    stones: [center, ...pave.stones],
    prongs: setting.prongs,
    galleries: [setting.gallery],
    beads: pave.beads,
    radialThicknessMm,
    axialWidthMm,
    sizeBarDegrees: 105,
    resizable: true,
  }
}

function haloRecipe(context: RecipeContext): StyleGeometry {
  const base = solitaireRecipe(context)
  const center = base.stones[0]
  const melee = estimateStoneDimensions('diamond', 'round', 0.018)
  const radiusX = center.dimensions.length / 2 + melee.width / 2 + 0.18
  const radiusZ = center.dimensions.width / 2 + melee.width / 2 + 0.18
  let haloCount = Math.max(
    8,
    Math.floor((Math.PI * 2 * Math.min(radiusX, radiusZ)) / (melee.width + 0.15)),
  )
  const minimumPitch = melee.width + 0.15
  while (haloCount > 8) {
    const points = Array.from({ length: haloCount }, (_, index) => {
      const angle = (index / haloCount) * Math.PI * 2
      return [Math.cos(angle) * radiusX, Math.sin(angle) * radiusZ] as const
    })
    const clears = points.every((point, index) => {
      const next = points[(index + 1) % points.length]
      return Math.hypot(point[0] - next[0], point[1] - next[1]) >= minimumPitch
    })
    if (clears) break
    haloCount -= 1
  }
  const halo = Array.from({ length: haloCount }, (_, index): LayoutStone => {
    const angle = (index / haloCount) * Math.PI * 2
    return {
      id: `halo-${index}`,
      role: 'halo',
      stone: 'diamond',
      cut: 'round',
      dimensions: melee,
      center: [
        center.center[0] + Math.cos(angle) * radiusX,
        center.center[1] - 0.08,
        center.center[2] + Math.sin(angle) * radiusZ,
      ],
      rotation: [0, 0, 0],
    }
  })
  return {
    ...base,
    stones: [center, ...halo, ...base.stones.slice(1)],
    radialThicknessMm: 1.9,
    axialWidthMm: 2.5,
  }
}

function threeStoneRecipe(context: RecipeContext): StyleGeometry {
  const base = solitaireRecipe(context)
  const center = base.stones[0]
  const sideDimensions = estimateStoneDimensions(context.config.stone, 'round', context.config.carats * 0.28)
  const offset = center.dimensions.length / 2 + sideDimensions.length / 2 + 0.45
  const sides: LayoutStone[] = [-1, 1].map((side) => ({
    id: side < 0 ? 'side-left' : 'side-right',
    role: 'side',
    stone: context.config.stone,
    cut: 'round',
    dimensions: sideDimensions,
    center: [
      side * offset,
      center.center[1] - sideDimensions.pavilionDepth * 0.2,
      0,
    ],
    rotation: [0, 0, side * 0.12],
  }))
  const settings = sides.map((stone) => stoneSetting(stone, 4))
  return {
    ...base,
    stones: [center, ...sides, ...base.stones.filter((stone) => stone.role === 'pave').slice(0, 4)],
    prongs: [...base.prongs, ...settings.flatMap((setting) => setting.prongs)],
    galleries: [base.galleries[0], ...settings.map((setting) => setting.gallery)],
    radialThicknessMm: 2,
    axialWidthMm: 2.6,
  }
}

function eternityRecipe({ config, innerRadiusMm }: RecipeContext): StyleGeometry {
  const radialThicknessMm = 1.8
  const axialWidthMm = 2.8
  const dimensions = estimateStoneDimensions('diamond', 'round', 0.02)
  const orbit = innerRadiusMm + radialThicknessMm + dimensions.width / 2 - 0.12
  const pitch = dimensions.width + 0.15
  const count = Math.max(16, Math.floor((Math.PI * 2 * orbit) / pitch))
  const stones = Array.from({ length: count }, (_, index): LayoutStone => {
    const angle = (index / count) * Math.PI * 2
    return {
      id: `eternity-${index}`,
      role: 'eternity',
      stone: config.stone,
      cut: 'round',
      dimensions,
      center: [Math.cos(angle) * orbit, Math.sin(angle) * orbit, 0],
      rotation: [0, 0, angle - Math.PI / 2],
    }
  })
  const beads = stones.flatMap((stone, index) =>
    fourPaveProngs(stone, (index / count) * Math.PI * 2),
  )
  return {
    stones,
    prongs: [],
    galleries: [],
    beads,
    radialThicknessMm,
    axialWidthMm,
    sizeBarDegrees: 0,
    resizable: false,
  }
}

export const styleRecipes = {
  solitaire: solitaireRecipe,
  halo: haloRecipe,
  'three-stone': threeStoneRecipe,
  eternity: eternityRecipe,
} as const
