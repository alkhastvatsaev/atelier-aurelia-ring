import { MeshRefractionMaterial, useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
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

export function GemMaterial({
  stone,
  small = false,
}: {
  stone: StoneId
  small?: boolean
}) {
  const optics = gemstones[stone]
  return (
    <meshPhysicalMaterial
      color={optics.color}
      roughness={0.015}
      metalness={0}
      transmission={small ? 0.88 : 0.96}
      thickness={small ? 0.22 : 0.9}
      ior={optics.ior}
      dispersion={optics.dispersion}
      envMapIntensity={2.1}
      clearcoat={0.12}
      clearcoatRoughness={0.015}
      attenuationColor={optics.color}
      attenuationDistance={small ? 0.65 : 1.6}
      side={THREE.DoubleSide}
    />
  )
}

export function GemRefractionMaterial({ stone }: { stone: StoneId }) {
  const envMap = useEnvironment({ files: '/hdri/studio_small_09_1k.hdr' })
  const optics = gemstones[stone]

  return (
    <MeshRefractionMaterial
      envMap={envMap}
      color={optics.color}
      ior={optics.ior}
      bounces={4}
      fresnel={1}
      aberrationStrength={optics.dispersion}
      fastChroma={false}
      toneMapped={false}
    />
  )
}
