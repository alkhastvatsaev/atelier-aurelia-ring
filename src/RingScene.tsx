import {
  ContactShadows,
  Environment,
  OrbitControls,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { RingConfig } from './config'
import { buildRingDesign } from './geometry/buildDesign'
import { RingPreview } from './rendering/three/RingPreview'

export function RingScene({ config }: { config: RingConfig }) {
  const design = useMemo(() => buildRingDesign(config), [config])

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.8], fov: 32 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.AgXToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMappingExposure = 0.95
      }}
      fallback={<div className="scene-loader">AURELIA</div>}
      aria-label="Aperçu 3D pré-CAO de votre bague"
    >
      <color attach="background" args={['#eee9e1']} />
      <ambientLight intensity={0.04} />
      <directionalLight
        color="#ffffff"
        position={[3.5, 5.5, 4.5]}
        intensity={1.35}
        castShadow
        shadow-mapSize={2048}
      />
      <Environment
        files="/hdri/studio_small_09_1k.hdr"
        background={false}
        environmentIntensity={0.9}
        environmentRotation={[0, 0.35, 0]}
      />
      <RingPreview design={design} />
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
        target={[0, 0, 0]}
        minDistance={4.3}
        maxDistance={7.2}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  )
}
