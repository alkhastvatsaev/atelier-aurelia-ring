import { ContactShadows, Float, OrbitControls, RoundedBox, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import type { CutId, RingConfig } from './config'
import { metals, stones } from './config'

function Gem({ cut, color }: { cut: CutId; color: string }) {
  const geometry = useMemo(() => {
    if (cut === 'emerald') {
      return new THREE.BoxGeometry(0.68, 0.32, 0.52, 2, 1, 2)
    }
    if (cut === 'oval') {
      const gem = new THREE.OctahedronGeometry(0.48, 2)
      gem.scale(1, 0.7, 0.76)
      return gem
    }
    return new THREE.OctahedronGeometry(0.46, 3)
  }, [cut])

  return (
    <mesh geometry={geometry} rotation={[0.15, 0.15, 0]}>
      <meshPhysicalMaterial
        color={color}
        roughness={0.04}
        metalness={0}
        transmission={0.55}
        thickness={1.5}
        ior={2.35}
        envMapIntensity={2.8}
        clearcoat={1}
        clearcoatRoughness={0.03}
      />
    </mesh>
  )
}

function Ring({ config }: { config: RingConfig }) {
  const metal = metals[config.metal]
  const stone = stones[config.stone]
  const ringRadius = 1.18 + (config.size - 50) * 0.012
  const stoneScale = 0.78 + config.carats * 0.2

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12}>
      <group rotation={[0.08, -0.24, -0.08]} position={[0, -0.08, 0]}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[ringRadius, 0.16, 32, 140]} />
          <meshStandardMaterial
            color={metal.color}
            metalness={1}
            roughness={config.metal === 'platinum' ? 0.18 : 0.13}
            envMapIntensity={2.4}
          />
        </mesh>

        <group position={[0, ringRadius + 0.26, 0]}>
          <RoundedBox args={[0.64, 0.22, 0.5]} radius={0.08} smoothness={5} castShadow>
            <meshStandardMaterial color={metal.color} metalness={1} roughness={0.14} />
          </RoundedBox>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.33, 0.22, 0]} rotation={[0, 0, side * -0.17]}>
              <cylinderGeometry args={[0.035, 0.045, 0.38, 12]} />
              <meshStandardMaterial color={metal.color} metalness={1} roughness={0.15} />
            </mesh>
          ))}
          <group position={[0, 0.31, 0]} scale={stoneScale}>
            <Gem cut={config.cut} color={stone.color} />
          </group>
        </group>

        {config.engraving && (
          <Text
            position={[0, -0.95, 0.17]}
            rotation={[0, 0, 0]}
            fontSize={0.105}
            letterSpacing={0.04}
            color={config.metal === 'platinum' ? '#777974' : '#765b2c'}
            anchorX="center"
            anchorY="middle"
            maxWidth={1.25}
          >
            {config.engraving.toUpperCase()}
          </Text>
        )}
      </group>
    </Float>
  )
}

export function RingScene({ config }: { config: RingConfig }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.15, 4.4], fov: 36 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      aria-label="Aperçu 3D interactif de votre bague"
    >
      <color attach="background" args={['#ebe6dc']} />
      <fog attach="fog" args={['#ebe6dc', 5, 9]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[3, 4, 5]} intensity={4} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-4, 1, 2]} intensity={2.2} color="#b5cef5" />
      <pointLight position={[0, -2, 3]} intensity={1.2} color="#fff2d7" />
      <Suspense fallback={null}>
        <Ring config={config} />
      </Suspense>
      <ContactShadows
        position={[0, -1.65, 0]}
        opacity={0.28}
        scale={5}
        blur={2.8}
        far={4}
        color="#877e70"
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3.1}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.55}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.55}
      />
    </Canvas>
  )
}
