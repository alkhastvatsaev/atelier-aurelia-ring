import * as THREE from 'three'
import type { CutId, StoneDimensionsMm } from '../../domain/types'

function triangle(
  vertices: number[],
  first: readonly number[],
  second: readonly number[],
  third: readonly number[],
) {
  vertices.push(...first, ...second, ...third)
}

function facetedGeometry(
  dimensions: StoneDimensionsMm,
  segments: number,
  radiusX: number,
  radiusZ: number,
) {
  const vertices: number[] = []
  const tableY = dimensions.crownHeight
  const girdleTopY = 0
  const girdleBottomY = -dimensions.girdleThickness
  const pavilionY = -dimensions.pavilionDepth
  const tableX = radiusX * 0.48
  const tableZ = radiusZ * 0.48
  const point = (xRadius: number, zRadius: number, y: number, index: number) => {
    const angle = (index / segments) * Math.PI * 2
    return [Math.cos(angle) * xRadius, y, Math.sin(angle) * zRadius] as const
  }

  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments
    const tableA = point(tableX, tableZ, tableY, index)
    const tableB = point(tableX, tableZ, tableY, next)
    const girdleA = point(radiusX, radiusZ, girdleTopY, index)
    const girdleB = point(radiusX, radiusZ, girdleTopY, next)
    const lowerA = point(radiusX, radiusZ, girdleBottomY, index)
    const lowerB = point(radiusX, radiusZ, girdleBottomY, next)
    triangle(vertices, [0, tableY, 0], tableB, tableA)
    triangle(vertices, tableA, tableB, girdleA)
    triangle(vertices, tableB, girdleB, girdleA)
    triangle(vertices, girdleA, girdleB, lowerA)
    triangle(vertices, girdleB, lowerB, lowerA)
    triangle(vertices, lowerA, lowerB, [0, pavilionY, 0])
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

function emeraldGeometry(dimensions: StoneDimensionsMm) {
  const x = dimensions.length / 2
  const z = dimensions.width / 2
  const corner = Math.min(x, z) * 0.2
  const outline: [number, number][] = [
    [-x + corner, -z],
    [x - corner, -z],
    [x, -z + corner],
    [x, z - corner],
    [x - corner, z],
    [-x + corner, z],
    [-x, z - corner],
    [-x, -z + corner],
  ]
  const vertices: number[] = []
  const tableY = dimensions.crownHeight
  const pavilionY = -dimensions.pavilionDepth

  for (let index = 0; index < outline.length; index += 1) {
    const next = (index + 1) % outline.length
    const [ax, az] = outline[index]
    const [bx, bz] = outline[next]
    const tableA = [ax * 0.58, tableY, az * 0.58] as const
    const tableB = [bx * 0.58, tableY, bz * 0.58] as const
    const girdleA = [ax, 0, az] as const
    const girdleB = [bx, 0, bz] as const
    triangle(vertices, [0, tableY, 0], tableB, tableA)
    triangle(vertices, tableA, tableB, girdleA)
    triangle(vertices, tableB, girdleB, girdleA)
    triangle(vertices, girdleA, girdleB, [0, pavilionY, 0])
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function createGemGeometry(cut: CutId, dimensions: StoneDimensionsMm) {
  if (cut === 'emerald') return emeraldGeometry(dimensions)
  return facetedGeometry(
    dimensions,
    cut === 'round' ? 16 : 20,
    dimensions.length / 2,
    dimensions.width / 2,
  )
}
