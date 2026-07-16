import * as THREE from 'three'
import type { CutId, StoneDimensionsMm } from '../../domain/types'

type Point = readonly [number, number, number]
type FacetFamily =
  | 'table'
  | 'star'
  | 'bezel'
  | 'upper-girdle'
  | 'girdle'
  | 'lower-girdle'
  | 'pavilion-main'
  | 'culet'
  | 'crown-step'
  | 'pavilion-step'

export const FACET_SPECIFICATIONS = {
  round: {
    label: 'Brillant rond',
    facetCount: 58,
    note: '33 facettes de couronne, 24 de pavillon et culet.',
  },
  oval: {
    label: 'Brillant modifié ovale',
    facetCount: 58,
    note: 'Topologie brillante 58 facettes adaptée à une ellipse.',
  },
  emerald: {
    label: 'Taille émeraude à degrés',
    facetCount: 57,
    note: '25 facettes de couronne, 8 de rondiste et 24 de pavillon.',
  },
} as const satisfies Record<CutId, {
  label: string
  facetCount: number
  note: string
}>

class FacetBuilder {
  private positions: number[] = []
  private normals: number[] = []
  private logicalFacetCount = 0
  private families: Partial<Record<FacetFamily, number>> = {}

  addFacet(points: Point[], family: FacetFamily, counted = true) {
    if (points.length < 3) return
    const ordered = [...points]
    const normal = new THREE.Vector3()
      .subVectors(
        new THREE.Vector3(...ordered[1]),
        new THREE.Vector3(...ordered[0]),
      )
      .cross(
        new THREE.Vector3().subVectors(
          new THREE.Vector3(...ordered[2]),
          new THREE.Vector3(...ordered[0]),
        ),
      )
      .normalize()
    const centroid = ordered
      .reduce((sum, point) => sum.add(new THREE.Vector3(...point)), new THREE.Vector3())
      .multiplyScalar(1 / ordered.length)

    if (normal.dot(centroid) < 0) {
      ordered.reverse()
      normal.multiplyScalar(-1)
    }

    for (let index = 1; index < ordered.length - 1; index += 1) {
      const triangle = [ordered[0], ordered[index], ordered[index + 1]]
      for (const point of triangle) {
        this.positions.push(...point)
        this.normals.push(normal.x, normal.y, normal.z)
      }
    }

    if (counted) {
      this.logicalFacetCount += 1
      this.families[family] = (this.families[family] ?? 0) + 1
    }
  }

  build(cut: CutId) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(this.positions, 3),
    )
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(this.normals, 3),
    )
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    geometry.userData = {
      cut,
      logicalFacetCount: this.logicalFacetCount,
      facetFamilies: this.families,
      specification: FACET_SPECIFICATIONS[cut],
    }
    return geometry
  }
}

function ellipsePoint(
  radiusX: number,
  radiusZ: number,
  y: number,
  index: number,
  count: number,
  offset = 0,
): Point {
  const angle = ((index + offset) / count) * Math.PI * 2
  return [Math.cos(angle) * radiusX, y, Math.sin(angle) * radiusZ]
}

function brilliantGeometry(cut: 'round' | 'oval', dimensions: StoneDimensionsMm) {
  const builder = new FacetBuilder()
  const radiusX = dimensions.length / 2
  const radiusZ = dimensions.width / 2
  const crownY = dimensions.crownHeight
  const girdleTopY = 0
  const girdleBottomY = -dimensions.girdleThickness
  const pavilionY = -dimensions.pavilionDepth

  const table = Array.from({ length: 8 }, (_, index) =>
    ellipsePoint(radiusX * 0.55, radiusZ * 0.55, crownY, index, 8),
  )
  const starBreak = Array.from({ length: 8 }, (_, index) =>
    ellipsePoint(
      radiusX * 0.78,
      radiusZ * 0.78,
      crownY * 0.44,
      index,
      8,
      0.5,
    ),
  )
  const girdleTop = Array.from({ length: 16 }, (_, index) =>
    ellipsePoint(radiusX, radiusZ, girdleTopY, index, 16),
  )
  const girdleBottom = Array.from({ length: 16 }, (_, index) =>
    ellipsePoint(radiusX, radiusZ, girdleBottomY, index, 16),
  )
  const lowerBreak = Array.from({ length: 8 }, (_, index) =>
    ellipsePoint(
      radiusX * 0.52,
      radiusZ * 0.52,
      pavilionY * 0.44,
      index,
      8,
      0.5,
    ),
  )
  const culet = Array.from({ length: 8 }, (_, index) =>
    ellipsePoint(radiusX * 0.015, radiusZ * 0.015, pavilionY, index, 8),
  )

  builder.addFacet(table, 'table')
  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    const previous = (index + 7) % 8
    const even = index * 2
    const middle = even + 1
    const nextEven = (even + 2) % 16

    builder.addFacet([table[index], table[next], starBreak[index]], 'star')
    builder.addFacet(
      [table[index], starBreak[index], girdleTop[even], starBreak[previous]],
      'bezel',
    )
    builder.addFacet(
      [starBreak[index], girdleTop[middle], girdleTop[even]],
      'upper-girdle',
    )
    builder.addFacet(
      [starBreak[index], girdleTop[nextEven], girdleTop[middle]],
      'upper-girdle',
    )

    builder.addFacet(
      [girdleBottom[even], girdleBottom[middle], lowerBreak[index]],
      'lower-girdle',
    )
    builder.addFacet(
      [girdleBottom[middle], girdleBottom[nextEven], lowerBreak[index]],
      'lower-girdle',
    )
    builder.addFacet(
      [girdleBottom[even], lowerBreak[index], culet[index], lowerBreak[previous]],
      'pavilion-main',
    )
  }

  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16
    builder.addFacet(
      [
        girdleTop[index],
        girdleTop[next],
        girdleBottom[next],
        girdleBottom[index],
      ],
      'girdle',
      false,
    )
  }
  builder.addFacet(culet, 'culet')
  return builder.build(cut)
}

function emeraldOutline(
  dimensions: StoneDimensionsMm,
  scale: number,
  y: number,
): Point[] {
  const x = (dimensions.length / 2) * scale
  const z = (dimensions.width / 2) * scale
  const corner = Math.min(x, z) * 0.2
  return [
    [-x + corner, y, -z],
    [x - corner, y, -z],
    [x, y, -z + corner],
    [x, y, z - corner],
    [x - corner, y, z],
    [-x + corner, y, z],
    [-x, y, z - corner],
    [-x, y, -z + corner],
  ]
}

function addStepRing(
  builder: FacetBuilder,
  outer: Point[],
  inner: Point[],
  family: 'crown-step' | 'girdle' | 'pavilion-step',
  counted = true,
) {
  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    builder.addFacet(
      [inner[index], inner[next], outer[next], outer[index]],
      family,
      counted,
    )
  }
}

function emeraldGeometry(dimensions: StoneDimensionsMm) {
  const builder = new FacetBuilder()
  const crown = dimensions.crownHeight
  const pavilion = dimensions.pavilionDepth
  const table = emeraldOutline(dimensions, 0.55, crown)
  const crownStepOne = emeraldOutline(dimensions, 0.7, crown * 0.66)
  const crownStepTwo = emeraldOutline(dimensions, 0.86, crown * 0.3)
  const girdleTop = emeraldOutline(dimensions, 1, 0)
  const girdleBottom = emeraldOutline(dimensions, 1, -dimensions.girdleThickness)
  const pavilionStepOne = emeraldOutline(dimensions, 0.72, -pavilion * 0.34)
  const pavilionStepTwo = emeraldOutline(dimensions, 0.38, -pavilion * 0.7)
  const culet = emeraldOutline(dimensions, 0.025, -pavilion)

  builder.addFacet(table, 'table')
  addStepRing(builder, crownStepOne, table, 'crown-step')
  addStepRing(builder, crownStepTwo, crownStepOne, 'crown-step')
  addStepRing(builder, girdleTop, crownStepTwo, 'crown-step')
  addStepRing(builder, girdleBottom, girdleTop, 'girdle')
  addStepRing(builder, pavilionStepOne, girdleBottom, 'pavilion-step')
  addStepRing(builder, pavilionStepTwo, pavilionStepOne, 'pavilion-step')
  addStepRing(builder, culet, pavilionStepTwo, 'pavilion-step')
  builder.addFacet(culet, 'culet', false)
  return builder.build('emerald')
}

export function createGemGeometry(cut: CutId, dimensions: StoneDimensionsMm) {
  return cut === 'emerald'
    ? emeraldGeometry(dimensions)
    : brilliantGeometry(cut, dimensions)
}
