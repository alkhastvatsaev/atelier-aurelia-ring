import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { CutId, RingConfig } from './config'
import { metals, stones } from './config'

function createBrilliantGeometry(segments = 16) {
  const vertices: number[] = []
  const tableRadius = 0.2
  const girdleRadius = 0.43
  const tableY = 0.19
  const girdleTopY = 0.01
  const girdleBottomY = -0.045
  const pavilionY = -0.38

  const point = (radius: number, y: number, index: number, offset = 0) => {
    const angle = (index / segments) * Math.PI * 2 + offset
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as const
  }
  const triangle = (a: readonly number[], b: readonly number[], c: readonly number[]) => {
    vertices.push(...a, ...b, ...c)
  }

  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments
    const tableA = point(tableRadius, tableY, index)
    const tableB = point(tableRadius, tableY, next)
    const girdleA = point(girdleRadius, girdleTopY, index)
    const girdleB = point(girdleRadius, girdleTopY, next)
    const lowerA = point(girdleRadius, girdleBottomY, index)
    const lowerB = point(girdleRadius, girdleBottomY, next)

    triangle([0, tableY, 0], tableB, tableA)
    triangle(tableA, tableB, girdleA)
    triangle(tableB, girdleB, girdleA)
    triangle(girdleA, girdleB, lowerA)
    triangle(girdleB, lowerB, lowerA)
    triangle(lowerA, lowerB, [0, pavilionY, 0])
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

const brilliantGeometry = createBrilliantGeometry()

function MetalMaterial({ color, platinum = false }: { color: string; platinum?: boolean }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={1}
      roughness={platinum ? 0.17 : 0.13}
      envMapIntensity={3.4}
      clearcoat={0.8}
      clearcoatRoughness={0.09}
    />
  )
}

function GemMaterial({ color, small = false }: { color: string; small?: boolean }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.025}
      metalness={0}
      transmission={small ? 0.72 : 0.9}
      thickness={small ? 0.35 : 0.9}
      ior={2.42}
      envMapIntensity={4.5}
      clearcoat={1}
      clearcoatRoughness={0}
      attenuationColor={color}
      attenuationDistance={small ? 0.5 : 1.4}
      side={THREE.DoubleSide}
    />
  )
}

function CutGem({
  cut,
  color,
  small = false,
}: {
  cut: CutId
  color: string
  small?: boolean
}) {
  const geometry = useMemo(() => {
    if (cut === 'emerald') {
      const result = new THREE.CylinderGeometry(0.38, 0.33, 0.32, 8, 2, false)
      result.scale(1.18, 1, 0.78)
      return result
    }
    const result = brilliantGeometry.clone()
    if (cut === 'oval') result.scale(1.2, 1, 0.8)
    return result
  }, [cut])

  return (
    <mesh geometry={geometry} castShadow>
      <GemMaterial color={color} small={small} />
    </mesh>
  )
}

function Rod({
  start,
  end,
  radius,
  color,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  radius: number
  color: string
}) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const direction = end.clone().sub(start)
    return {
      midpoint: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize(),
      ),
      length: direction.length(),
    }
  }, [end, start])

  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius * 1.15, length, 12]} />
      <MetalMaterial color={color} />
    </mesh>
  )
}

function Basket({
  y,
  color,
  scale,
}: {
  y: number
  color: string
  scale: number
}) {
  return (
    <group position={[0, y, 0]} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.34, 0.038, 12, 64]} />
        <MetalMaterial color={color} />
      </mesh>

      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2
        const x = Math.cos(angle)
        const z = Math.sin(angle)
        return (
          <group key={angle}>
            <Rod
              start={new THREE.Vector3(x * 0.19, -0.3, z * 0.16)}
              end={new THREE.Vector3(x * 0.37, 0.28, z * 0.3)}
              radius={0.027}
              color={color}
            />
            <mesh position={[x * 0.37, 0.29, z * 0.3]} castShadow>
              <sphereGeometry args={[0.045, 16, 12]} />
              <MetalMaterial color={color} />
            </mesh>
          </group>
        )
      })}

      {Array.from({ length: 4 }, (_, index) => {
        const angle = Math.PI / 4 + (index / 4) * Math.PI * 2
        return (
          <Rod
            key={angle}
            start={new THREE.Vector3(Math.cos(angle) * 0.12, -0.36, Math.sin(angle) * 0.1)}
            end={new THREE.Vector3(Math.cos(angle) * 0.31, -0.02, Math.sin(angle) * 0.25)}
            radius={0.022}
            color={color}
          />
        )
      })}
    </group>
  )
}

function PaveStone({
  angle,
  radius,
  metalColor,
}: {
  angle: number
  radius: number
  metalColor: string
}) {
  const x = Math.cos(angle)
  const y = Math.sin(angle)

  return (
    <group position={[x * radius, y * radius, 0.015]} rotation={[0, 0, angle - Math.PI / 2]}>
      <group scale={0.25}>
        <CutGem cut="round" color="#f5fbff" small />
      </group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.055, 0, 0.04]}
          castShadow
        >
          <sphereGeometry args={[0.025, 12, 10]} />
          <MetalMaterial color={metalColor} />
        </mesh>
      ))}
    </group>
  )
}

function JewelryRing({ config }: { config: RingConfig }) {
  const metal = metals[config.metal]
  const stone = stones[config.stone]
  const ringRadius = 1.14 + (config.size - 50) * 0.011
  const stoneScale = 0.77 + config.carats * 0.085
  const topY = ringRadius + 0.24
  const paveAngles = [
    0.56, 0.69, 0.82, 0.95, 1.08, 1.21,
    Math.PI - 1.21, Math.PI - 1.08, Math.PI - 0.95,
    Math.PI - 0.82, Math.PI - 0.69, Math.PI - 0.56,
  ]

  return (
    <Float speed={0.8} rotationIntensity={0.025} floatIntensity={0.055}>
      <group rotation={[0.48, -0.24, -0.055]} position={[0, -0.18, 0]} scale={0.96}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[ringRadius, 0.145, 40, 180]} />
          <MetalMaterial color={metal.color} platinum={config.metal === 'platinum'} />
        </mesh>

        <mesh position={[0, ringRadius + 0.03, 0]} scale={[1, 0.45, 1.15]} castShadow>
          <sphereGeometry args={[0.31, 32, 24]} />
          <MetalMaterial color={metal.color} platinum={config.metal === 'platinum'} />
        </mesh>

        {paveAngles.map((angle) => (
          <PaveStone
            key={angle}
            angle={angle}
            radius={ringRadius + 0.145}
            metalColor={metal.color}
          />
        ))}

        <Basket y={topY} color={metal.color} scale={stoneScale} />
        <group position={[0, topY + 0.15 * stoneScale, 0]} scale={stoneScale}>
          <CutGem cut={config.cut} color={stone.color} />
        </group>
      </group>
    </Float>
  )
}

export function RingScene({ config }: { config: RingConfig }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.12, 5.8], fov: 32 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.18
      }}
      fallback={<div className="scene-loader">AURELIA</div>}
      aria-label="Aperçu 3D interactif de votre bague"
    >
      <color attach="background" args={['#eee9e1']} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[3, 5, 5]} intensity={2.8} castShadow shadow-mapSize={2048} />
      <Environment resolution={384}>
        <Lightformer form="rect" intensity={7} position={[0, 4, 4]} scale={[7, 1.2, 1]} />
        <Lightformer form="rect" intensity={4} position={[-4, 0, 2]} scale={[1.5, 5, 1]} />
        <Lightformer form="rect" intensity={3.5} position={[4, -1, 2]} scale={[1.5, 4, 1]} />
        <Lightformer form="ring" intensity={3} position={[0, -4, 3]} scale={2.5} />
      </Environment>
      <JewelryRing config={config} />
      <ContactShadows
        position={[0, -1.55, 0]}
        opacity={0.18}
        scale={5}
        blur={3.2}
        far={4}
        color="#766c60"
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4.3}
        maxDistance={7.2}
        autoRotate
        autoRotateSpeed={0.28}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.55}
      />
    </Canvas>
  )
}
