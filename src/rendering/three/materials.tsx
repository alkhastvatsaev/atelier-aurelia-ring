import { MeshRefractionMaterial, useEnvironment } from '@react-three/drei'
import { gemstones } from '../../domain/gemstones'
import type { StoneId } from '../../domain/types'

export function MetalMaterial({
  color,
  platinum = false,
}: {
  color: string
  platinum?: boolean
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={1}
      roughness={platinum ? 0.24 : 0.18}
      envMapIntensity={1.25}
      clearcoat={0}
    />
  )
}

export function GemRefractionMaterial({
  stone,
  small = false,
}: {
  stone: StoneId
  small?: boolean
}) {
  const envMap = useEnvironment({ files: '/hdri/studio_small_09_1k.hdr' })
  const optics = gemstones[stone]

  return (
    <MeshRefractionMaterial
      envMap={envMap}
      color={optics.color}
      ior={optics.ior}
      bounces={small ? 2 : 4}
      fresnel={1}
      aberrationStrength={optics.dispersion}
      fastChroma={small}
      toneMapped={false}
    />
  )
}
