import {
  ContactShadows,
  Environment,
  Lightformer,
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
      aria-label="Aperçu 3D pré-CAO de votre bague"
    >
      <color attach="background" args={['#eee9e1']} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[3, 5, 5]}
        intensity={2.8}
        castShadow
        shadow-mapSize={2048}
      />
      <Environment resolution={384}>
        <Lightformer form="rect" intensity={7} position={[0, 4, 4]} scale={[7, 1.2, 1]} />
        <Lightformer form="rect" intensity={4} position={[-4, 0, 2]} scale={[1.5, 5, 1]} />
        <Lightformer form="rect" intensity={3.5} position={[4, -1, 2]} scale={[1.5, 4, 1]} />
        <Lightformer form="ring" intensity={3} position={[0, -4, 3]} scale={2.5} />
      </Environment>
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
