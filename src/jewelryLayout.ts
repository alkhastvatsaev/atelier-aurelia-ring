import type { CutId, RingConfig } from './config'

export const JEWELRY_TOLERANCE = {
  stoneToMetal: 0.024,
  stoneToStone: 0.018,
  settingContact: 0.018,
} as const

type GemMetrics = {
  radiusX: number
  radiusZ: number
  crown: number
  pavilion: number
}

export type JewelryLayout = {
  ringRadius: number
  ringTube: number
  centerScale: number
  centerY: number
  basketY: number
  basketScale: number
  basketRadius: number
  prongCount: number
  paveRadius: number
  paveOrbitRadius: number
  paveAngles: number[]
  collisions: string[]
}

const GEM_METRICS: Record<CutId, GemMetrics> = {
  round: { radiusX: 0.43, radiusZ: 0.43, crown: 0.19, pavilion: 0.38 },
  oval: { radiusX: 0.516, radiusZ: 0.344, crown: 0.19, pavilion: 0.38 },
  emerald: { radiusX: 0.448, radiusZ: 0.296, crown: 0.16, pavilion: 0.16 },
}

function distance2d(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

function detectCollisions(
  paveAngles: number[],
  paveOrbitRadius: number,
  paveRadius: number,
  basketY: number,
  basketRadius: number,
  gemBottom: number,
  bandOuter: number,
) {
  const collisions: string[] = []
  const points = paveAngles.map((angle) => ({
    x: Math.cos(angle) * paveOrbitRadius,
    y: Math.sin(angle) * paveOrbitRadius,
  }))

  for (let first = 0; first < points.length; first += 1) {
    const point = points[first]
    if (distance2d(point.x, point.y, 0, basketY) < paveRadius + basketRadius) {
      collisions.push(`pavé ${first + 1} / chaton`)
    }
    for (let second = first + 1; second < points.length; second += 1) {
      if (
        distance2d(point.x, point.y, points[second].x, points[second].y) <
        paveRadius * 2 + JEWELRY_TOLERANCE.stoneToStone
      ) {
        collisions.push(`pavé ${first + 1} / pavé ${second + 1}`)
      }
    }
  }

  if (gemBottom < bandOuter + JEWELRY_TOLERANCE.stoneToMetal - 0.0001) {
    collisions.push('pavillon / anneau')
  }

  return collisions
}

export function calculateJewelryLayout(config: RingConfig): JewelryLayout {
  const ringTube = 0.145
  const ringRadius = 1.14 + (config.size - 50) * 0.011
  const bandOuter = ringRadius + ringTube
  const metrics = GEM_METRICS[config.cut]

  // A stone's linear dimensions grow with the cube root of its weight.
  const centerScale = 0.9 * Math.cbrt(config.carats / 1.2)
  const centerRadius = Math.max(metrics.radiusX, metrics.radiusZ) * centerScale
  const pavilionDepth = metrics.pavilion * centerScale
  const centerY = bandOuter + JEWELRY_TOLERANCE.stoneToMetal + pavilionDepth

  // The basket follows the girdle instead of scaling independently.
  const basketScale = Math.max(0.72, (centerRadius + JEWELRY_TOLERANCE.settingContact) / 0.37)
  const basketY = centerY - 0.15 * basketScale
  const basketRadius = 0.39 * basketScale + JEWELRY_TOLERANCE.stoneToMetal

  const paveRadius = 0.43 * 0.25
  const paveOrbitRadius = bandOuter + paveRadius - JEWELRY_TOLERANCE.settingContact
  const angularStep =
    2 *
    Math.asin(
      (paveRadius * 2 + JEWELRY_TOLERANCE.stoneToStone * 1.25) /
        (2 * paveOrbitRadius),
    ) +
    0.002

  const rightAngles: number[] = []
  for (let angle = 0.5; angle < Math.PI / 2; angle += angularStep) {
    const x = Math.cos(angle) * paveOrbitRadius
    const y = Math.sin(angle) * paveOrbitRadius
    const clearsBasket =
      distance2d(x, y, 0, basketY) >=
      paveRadius + basketRadius + JEWELRY_TOLERANCE.stoneToStone

    if (clearsBasket) rightAngles.push(angle)
  }

  const paveAngles = [
    ...rightAngles,
    ...rightAngles.map((angle) => Math.PI - angle).reverse(),
  ]
  const collisions = detectCollisions(
    paveAngles,
    paveOrbitRadius,
    paveRadius,
    basketY,
    basketRadius,
    centerY - pavilionDepth,
    bandOuter,
  )

  return {
    ringRadius,
    ringTube,
    centerScale,
    centerY,
    basketY,
    basketScale,
    basketRadius,
    prongCount: config.cut === 'emerald' ? 4 : 6,
    paveRadius,
    paveOrbitRadius,
    paveAngles,
    collisions,
  }
}
