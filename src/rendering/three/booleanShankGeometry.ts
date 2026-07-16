import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import type { SemanticLayout } from '../../geometry/types'

function createSeatCutter(
  seat: SemanticLayout['seats'][number],
): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(
    seat.topRadiusMm,
    seat.bottomRadiusMm,
    seat.depthMm,
    18,
    1,
    false,
  )
  geometry.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(...seat.center),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...seat.rotation)),
      new THREE.Vector3(1, 1, 1),
    ),
  )
  return geometry
}

export function createBooleanShankGeometry(layout: SemanticLayout) {
  const tubeRadius = layout.shank.radialThicknessMm / 2
  const torusRadius = layout.shank.innerRadiusMm + tubeRadius
  const axialScale = layout.shank.axialWidthMm / layout.shank.radialThicknessMm
  const shank = new THREE.TorusGeometry(torusRadius, tubeRadius, 28, 160)
  shank.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, axialScale))

  if (layout.seats.length === 0) {
    shank.userData.booleanSeatCount = 0
    return shank
  }

  const cutters = layout.seats.map(createSeatCutter)
  const mergedCutters = mergeGeometries(cutters, false)
  cutters.forEach((geometry) => geometry.dispose())
  if (!mergedCutters) {
    shank.userData.booleanSeatCount = 0
    return shank
  }

  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']
  evaluator.useGroups = false
  const shankBrush = new Brush(shank)
  const cutterBrush = new Brush(mergedCutters)
  shankBrush.updateMatrixWorld(true)
  cutterBrush.updateMatrixWorld(true)
  const result = evaluator.evaluate(shankBrush, cutterBrush, SUBTRACTION)
  result.geometry.computeBoundingBox()
  result.geometry.computeBoundingSphere()
  result.geometry.userData.booleanSeatCount = layout.seats.length
  shank.dispose()
  mergedCutters.dispose()
  return result.geometry
}
