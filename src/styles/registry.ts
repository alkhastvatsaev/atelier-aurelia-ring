import { estimateStoneDimensions } from '../domain/gemstones'
import type { RingConfig } from '../domain/types'
import type {
  LayoutArch,
  LayoutBead,
  LayoutGallery,
  LayoutProng,
  LayoutSeat,
  LayoutStone,
} from '../geometry/types'

const PRONG_ANGLE_RADIANS = (75 * Math.PI) / 180

export type StyleGeometry = {
  stones: LayoutStone[]
  prongs: LayoutProng[]
  galleries: LayoutGallery[]
  beads: LayoutBead[]
  seats: LayoutSeat[]
  arches: LayoutArch[]
  radialThicknessMm: number
  axialWidthMm: number
  sizeBarDegrees: number
  resizable: boolean
}

type RecipeContext = {
  config: RingConfig
  innerRadiusMm: number
}

function centerSetting(
  stone: LayoutStone,
): { prongs: LayoutProng[]; gallery: LayoutGallery } {
  const halfX = stone.dimensions.length / 2
  const halfZ = stone.dimensions.width / 2
  const culetY = stone.center[1] - stone.dimensions.pavilionDepth
  const galleryY = culetY + 0.5
  const prongs = Array.from({ length: 6 }, (_, index): LayoutProng => {
    const angle = Math.PI / 6 + (index / 6) * Math.PI * 2
    const x = Math.cos(angle)
    const z = Math.sin(angle)
    const endY = stone.center[1] + stone.dimensions.crownHeight * 0.76
    const startY = galleryY - 0.3
    const endX = x * (halfX + 0.16)
    const endZ = z * (halfZ + 0.16)
    const endRadius = Math.hypot(endX, endZ)
    const horizontalRun = (endY - startY) / Math.tan(PRONG_ANGLE_RADIANS)
    const startFactor = Math.max(0.24, (endRadius - horizontalRun) / endRadius)
    return {
      id: `${stone.id}-prong-${index}`,
      stoneId: stone.id,
      start: [
        stone.center[0] + endX * startFactor,
        startY,
        stone.center[2] + endZ * startFactor,
      ],
      end: [
        stone.center[0] + endX,
        endY,
        stone.center[2] + endZ,
      ],
      diameterMm: 0.58,
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
      radiusX: halfX * 0.74,
      radiusZ: halfZ * 0.74,
      wireDiameterMm: 0.52,
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

function stoneSeat(stone: LayoutStone, radialAngle: number): LayoutSeat {
  const depthMm = stone.dimensions.pavilionDepth + 0.32
  return {
    id: `${stone.id}-seat`,
    stoneId: stone.id,
    center: [
      stone.center[0] - Math.cos(radialAngle) * (depthMm / 2 - 0.06),
      stone.center[1] - Math.sin(radialAngle) * (depthMm / 2 - 0.06),
      stone.center[2],
    ],
    rotation: [0, 0, radialAngle - Math.PI / 2],
    depthMm,
    topRadiusMm: stone.dimensions.width * 0.46,
    bottomRadiusMm: stone.dimensions.width * 0.14,
  }
}

function uGallery(
  stone: LayoutStone,
  radialAngle: number,
): LayoutArch[] {
  const radialX = Math.cos(radialAngle)
  const radialY = Math.sin(radialAngle)
  const tangentX = -radialY
  const tangentY = radialX
  const tangentSpan = stone.dimensions.width * 0.42
  const galleryDrop = stone.dimensions.pavilionDepth + 0.24
  const sideZ = stone.dimensions.width * 0.36

  return [-1, 1].map((side): LayoutArch => ({
    id: `${stone.id}-u-${side < 0 ? 'back' : 'front'}`,
    stoneId: stone.id,
    points: [
      [
        stone.center[0] - tangentX * tangentSpan,
        stone.center[1] - tangentY * tangentSpan,
        stone.center[2] + side * sideZ,
      ],
      [
        stone.center[0] - radialX * galleryDrop,
        stone.center[1] - radialY * galleryDrop,
        stone.center[2] + side * sideZ,
      ],
      [
        stone.center[0] + tangentX * tangentSpan,
        stone.center[1] + tangentY * tangentSpan,
        stone.center[2] + side * sideZ,
      ],
    ],
    diameterMm: 0.42,
  }))
}

function sharedRiverProngs(stones: LayoutStone[]): LayoutBead[] {
  return stones.flatMap((stone, index) => {
    const next = stones[(index + 1) % stones.length]
    const midpointX = (stone.center[0] + next.center[0]) / 2
    const midpointY = (stone.center[1] + next.center[1]) / 2
    const midpointLength = Math.hypot(midpointX, midpointY)
    const radialLift = stone.dimensions.crownHeight * 0.28
    const axialOffset = stone.dimensions.width * 0.475

    return [
      {
        id: `shared-prong-${index}-front`,
        stoneId: stone.id,
        sharedWithStoneId: next.id,
        center: [
          midpointX + (midpointX / midpointLength) * radialLift,
          midpointY + (midpointY / midpointLength) * radialLift,
          axialOffset,
        ],
        diameterMm: 0.5,
        angleDeg: 45,
        sharedAngleDeg: 135,
      },
      {
        id: `shared-prong-${index}-back`,
        stoneId: stone.id,
        sharedWithStoneId: next.id,
        center: [
          midpointX + (midpointX / midpointLength) * radialLift,
          midpointY + (midpointY / midpointLength) * radialLift,
          -axialOffset,
        ],
        diameterMm: 0.5,
        angleDeg: 315,
        sharedAngleDeg: 225,
      },
    ] satisfies LayoutBead[]
  })
}

function makeRiverStones({
  count,
  orbit,
  startAngle,
  angularStep,
  role,
  idPrefix,
  config,
  carats,
}: {
  count: number
  orbit: number
  startAngle: number
  angularStep: number
  role: 'pave' | 'eternity'
  idPrefix: string
  config: RingConfig
  carats: number
}) {
  const dimensions = estimateStoneDimensions(
    role === 'pave' ? 'diamond' : config.stone,
    'round',
    carats,
  )
  const stones: LayoutStone[] = []
  const beads: LayoutBead[] = []
  const seats: LayoutSeat[] = []
  const arches: LayoutArch[] = []

  for (let index = 0; index < count; index += 1) {
    const angle = startAngle + angularStep * index
    const stone: LayoutStone = {
      id: `${idPrefix}-${index}`,
      role,
      stone: role === 'pave' ? 'diamond' : config.stone,
      cut: 'round',
      dimensions,
      center: [Math.cos(angle) * orbit, Math.sin(angle) * orbit, 0],
      rotation: [0, 0, angle - Math.PI / 2],
    }
    stones.push(stone)
    beads.push(...fourPaveProngs(stone, angle))
    seats.push(stoneSeat(stone, angle))
    arches.push(...uGallery(stone, angle))
  }

  return { stones, beads, seats, arches, dimensions }
}

function solitaireRecipe({
  config,
  innerRadiusMm,
}: RecipeContext): StyleGeometry {
  const radialThicknessMm = 2
  const axialWidthMm = 3.6
  const outerRadius = innerRadiusMm + radialThicknessMm
  const centerDimensions = estimateStoneDimensions(
    config.stone,
    'round',
    config.carats,
  )
  const center: LayoutStone = {
    id: 'center',
    role: 'center',
    stone: config.stone,
    cut: 'round',
    dimensions: centerDimensions,
    center: [0, outerRadius + centerDimensions.pavilionDepth + 0.48, 0],
    rotation: [0, 0, 0],
  }
  const setting = centerSetting(center)
  const shoulderCarats = 0.06
  const shoulderDimensions = estimateStoneDimensions(
    'diamond',
    'round',
    shoulderCarats,
  )
  const shoulderOrbit = outerRadius + 0.08
  const shoulderPitch = shoulderDimensions.width + 0.18
  const shoulderStep =
    2 * Math.asin(shoulderPitch / (2 * shoulderOrbit))
  const headClearance = Math.asin(
    Math.min(
      0.92,
      (centerDimensions.width / 2 + shoulderDimensions.width / 2 + 0.3) /
        shoulderOrbit,
    ),
  )
  const lastAngle = Math.PI / 2 - headClearance
  const shoulderCount = Math.max(
    3,
    Math.min(4, Math.floor((lastAngle - 0.36) / shoulderStep) + 1),
  )
  const right = makeRiverStones({
    count: shoulderCount,
    orbit: shoulderOrbit,
    startAngle: lastAngle - shoulderStep * (shoulderCount - 1),
    angularStep: shoulderStep,
    role: 'pave',
    idPrefix: 'pave-right',
    config,
    carats: shoulderCarats,
  })
  const left = makeRiverStones({
    count: shoulderCount,
    orbit: shoulderOrbit,
    startAngle: Math.PI - lastAngle,
    angularStep: shoulderStep,
    role: 'pave',
    idPrefix: 'pave-left',
    config,
    carats: shoulderCarats,
  })

  return {
    stones: [center, ...right.stones, ...left.stones],
    prongs: setting.prongs,
    galleries: [setting.gallery],
    beads: [...right.beads, ...left.beads],
    seats: [...right.seats, ...left.seats],
    arches: [
      ...uGallery(center, Math.PI / 2),
      ...right.arches,
      ...left.arches,
    ],
    radialThicknessMm,
    axialWidthMm,
    sizeBarDegrees: 95,
    resizable: true,
  }
}

function eternityRecipe({
  config,
  innerRadiusMm,
}: RecipeContext): StyleGeometry {
  const radialThicknessMm = 2.1
  const stoneCarats = 0.08 + ((config.carats - 0.5) / 2.5) * 0.12
  const dimensions = estimateStoneDimensions(
    config.stone,
    'round',
    stoneCarats,
  )
  const axialWidthMm = dimensions.width + 1.1
  const orbit = innerRadiusMm + radialThicknessMm + 0.08
  const pitch = dimensions.width + 0.18
  const count = Math.max(
    14,
    Math.floor((Math.PI * 2 * orbit) / pitch),
  )
  const river = makeRiverStones({
    count,
    orbit,
    startAngle: Math.PI / 2,
    angularStep: (Math.PI * 2) / count,
    role: 'eternity',
    idPrefix: 'eternity',
    config,
    carats: stoneCarats,
  })
  const sharedProngs = sharedRiverProngs(river.stones)

  return {
    stones: river.stones,
    prongs: [],
    galleries: [],
    beads: sharedProngs,
    seats: river.seats,
    arches: river.arches,
    radialThicknessMm,
    axialWidthMm,
    sizeBarDegrees: 0,
    resizable: false,
  }
}

export const styleRecipes = {
  solitaire: solitaireRecipe,
  eternity: eternityRecipe,
} as const
