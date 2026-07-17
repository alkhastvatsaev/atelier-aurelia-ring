import * as THREE from 'three'

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
  color,
  small = false,
}: {
  color: string
  small?: boolean
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.025}
      metalness={0}
      transmission={small ? 0.72 : 0.9}
      thickness={small ? 0.35 : 0.9}
      ior={2.42}
      envMapIntensity={2.1}
      clearcoat={0.35}
      clearcoatRoughness={0.03}
      attenuationColor={color}
      attenuationDistance={small ? 0.5 : 1.4}
      side={THREE.DoubleSide}
    />
  )
}
