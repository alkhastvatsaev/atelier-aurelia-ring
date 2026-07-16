import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import type { CutId, RingConfig } from './config'
import { metals, stones } from './config'

function Gem({ cut, color }: { cut: CutId; color: string }) {
  const geometry = useMemo(() => {
    if (cut === 'emerald') {
      const gem = new THREE.BoxGeometry(0.56, 0.28, 0.42, 2, 1, 2)
      gem.rotateX(0.08)
      return gem
    }
    if (cut === 'oval') {
      const gem = new THREE.OctahedronGeometry(0.36, 2)
      gem.scale(1, 0.68, 0.76)
      return gem
    }
    return new THREE.OctahedronGeometry(0.34, 3)
  }, [cut])

  return (
    <mesh geometry={geometry} rotation={[0.08, 0.2, 0]}>
      <meshPhysicalMaterial
        color={color}
        roughness={0.07}
        metalness={0}
        transmission={0.72}
        thickness={0.8}
        ior={2.2}
        envMapIntensity={3.2}
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
  const stoneScale = 0.82 + config.carats * 0.15

  return (
    <Float speed={1} rotationIntensity={0.04} floatIntensity={0.08}>
      <group rotation={[0.18, -0.32, -0.06]} position={[0, -0.14, 0]} scale={0.92}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[ringRadius, 0.16, 32, 140]} />
          <meshPhysicalMaterial
            color={metal.color}
            metalness={1}
            roughness={config.metal === 'platinum' ? 0.2 : 0.16}
            envMapIntensity={2.8}
            clearcoat={0.7}
            clearcoatRoughness={0.12}
          />
        </mesh>

        <group position={[0, ringRadius + 0.22, 0]}>
          <RoundedBox args={[0.56, 0.18, 0.42]} radius={0.07} smoothness={5} castShadow>
            <meshPhysicalMaterial
              color={metal.color}
              metalness={1}
              roughness={0.17}
              envMapIntensity={2.8}
              clearcoat={0.6}
            />
          </RoundedBox>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.28, 0.18, 0]} rotation={[0, 0, side * -0.18]}>
              <cylinderGeometry args={[0.028, 0.04, 0.3, 12]} />
              <meshPhysicalMaterial
                color={metal.color}
                metalness={1}
                roughness={0.17}
                envMapIntensity={2.8}
              />
            </mesh>
          ))}
          <group position={[0, 0.26, 0]} scale={stoneScale}>
            <Gem cut={config.cut} color={stone.color} />
          </group>
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
      camera={{ position: [0, 0.1, 5.6], fov: 34 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.25
      }}
      fallback={
        <div className="webgl-fallback" role="img" aria-label="Silhouette de la bague">
          <span />
        </div>
      }
      aria-label="Aperçu 3D interactif de votre bague"
    >
      <color attach="background" args={['#f0ede6']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 5]} intensity={2.4} castShadow shadow-mapSize={1024} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} position={[0, 4, 4]} scale={[6, 1.5, 1]} />
        <Lightformer form="rect" intensity={3} position={[-4, 0, 2]} scale={[2, 5, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[4, -1, 1]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, -4, 2]} scale={2} />
      </Environment>
      <Suspense fallback={null}>
        <Ring config={config} />
      </Suspense>
      <ContactShadows
        position={[0, -1.55, 0]}
        opacity={0.2}
        scale={5}
        blur={2.8}
        far={4}
        color="#877e70"
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4.2}
        maxDistance={7}
        autoRotate
        autoRotateSpeed={0.35}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.55}
      />
    </Canvas>
  )
}
