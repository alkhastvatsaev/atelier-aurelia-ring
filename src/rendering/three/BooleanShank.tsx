import { useEffect, useMemo } from 'react'
import type { SemanticLayout } from '../../geometry/types'
import { createBooleanShankGeometry } from './booleanShankGeometry'
import { MetalMaterial } from './materials'

export function BooleanShank({
  layout,
  color,
}: {
  layout: SemanticLayout
  color: string
}) {
  const geometry = useMemo(() => createBooleanShankGeometry(layout), [layout])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <MetalMaterial color={color} platinum={layout.metal === 'platinum'} />
    </mesh>
  )
}
