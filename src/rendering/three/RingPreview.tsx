import { Caustics, Float } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { gemstones } from '../../domain/gemstones'
import { alloys } from '../../domain/materials'
import type {
  LayoutArch,
  LayoutGallery,
  LayoutProng,
  LayoutStone,
  Vec3Mm,
} from '../../geometry/types'
import type { RingDesign } from '../../geometry/buildDesign'
import { BooleanShank } from './BooleanShank'
import { createGemGeometry } from './gemGeometries'
import { GemRefractionMaterial, MetalMaterial } from './materials'

const WORLD_PER_MM = 0.12

function GemMesh({
  stone,
  position,
}: {
  stone: LayoutStone
  position: Vec3Mm
}) {
  const geometry = useMemo(
    () => createGemGeometry(stone.cut, stone.dimensions),
    [stone.cut, stone.dimensions],
  )
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={stone.rotation}
      castShadow
    >
      <GemRefractionMaterial
        stone={stone.stone}
        small={stone.role === 'pave' || stone.role === 'eternity'}
      />
    </mesh>
  )
}

function Gem({ stone }: { stone: LayoutStone }) {
  if (stone.role !== 'center') {
    return <GemMesh stone={stone} position={stone.center} />
  }

  const projectionY =
    stone.center[1] - stone.dimensions.pavilionDepth - 0.5
  const localStonePosition: Vec3Mm = [
    0,
    stone.center[1] - projectionY,
    0,
  ]

  return (
    <Caustics
      position={[stone.center[0], projectionY, stone.center[2]]}
      frames={1}
      causticsOnly={false}
      backside
      ior={gemstones[stone.stone].ior}
      backsideIOR={1}
      worldRadius={0.025}
      intensity={0.065}
      resolution={256}
      lightSource={[3.5, 5.5, 4.5]}
      color={gemstones[stone.stone].color}
    >
      <GemMesh stone={stone} position={localStonePosition} />
    </Caustics>
  )
}

function Rod({
  start,
  end,
  diameter,
  color,
}: {
  start: Vec3Mm
  end: Vec3Mm
  diameter: number
  color: string
}) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const from = new THREE.Vector3(...start)
    const to = new THREE.Vector3(...end)
    const direction = to.clone().sub(from)
    return {
      midpoint: from.add(to).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize(),
      ),
      length: direction.length(),
    }
  }, [end, start])

  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[diameter / 2, diameter * 0.56, length, 14]} />
      <MetalMaterial color={color} />
    </mesh>
  )
}

function Prong({ prong, color }: { prong: LayoutProng; color: string }) {
  return (
    <group>
      <Rod
        start={prong.start}
        end={prong.end}
        diameter={prong.diameterMm}
        color={color}
      />
      <mesh position={prong.end} castShadow>
        <sphereGeometry args={[prong.diameterMm * 0.54, 16, 12]} />
        <MetalMaterial color={color} />
      </mesh>
    </group>
  )
}

function Gallery({ gallery, color }: { gallery: LayoutGallery; color: string }) {
  const geometry = useMemo(() => {
    const points = Array.from({ length: 48 }, (_, index) => {
      const angle = (index / 48) * Math.PI * 2
      return new THREE.Vector3(
        gallery.center[0] + Math.cos(angle) * gallery.radiusX,
        gallery.center[1],
        gallery.center[2] + Math.sin(angle) * gallery.radiusZ,
      )
    })
    const curve = new THREE.CatmullRomCurve3(points, true)
    return new THREE.TubeGeometry(curve, 64, gallery.wireDiameterMm / 2, 10, true)
  }, [gallery])

  return (
    <mesh geometry={geometry} castShadow>
      <MetalMaterial color={color} />
    </mesh>
  )
}

function Arch({ arch, color }: { arch: LayoutArch; color: string }) {
  const geometry = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...arch.points[0]),
      new THREE.Vector3(...arch.points[1]),
      new THREE.Vector3(...arch.points[2]),
    )
    return new THREE.TubeGeometry(
      curve,
      24,
      arch.diameterMm / 2,
      8,
      false,
    )
  }, [arch])

  return (
    <mesh geometry={geometry} castShadow>
      <MetalMaterial color={color} />
    </mesh>
  )
}

export function RingPreview({ design }: { design: RingDesign }) {
  const { layout } = design
  const alloy = alloys[layout.metal]

  return (
    <Float speed={0.75} rotationIntensity={0} floatIntensity={0.025}>
      <group
        scale={WORLD_PER_MM}
        rotation={[0, 0, 0]}
        position={[0, -0.18, 0]}
      >
        <BooleanShank layout={layout} color={alloy.color} />

        {layout.galleries.map((gallery) => (
          <Gallery key={gallery.id} gallery={gallery} color={alloy.color} />
        ))}
        {layout.prongs.map((prong) => (
          <Prong key={prong.id} prong={prong} color={alloy.color} />
        ))}
        {layout.arches.map((arch) => (
          <Arch key={arch.id} arch={arch} color={alloy.color} />
        ))}
        {layout.beads.map((bead) => (
          <mesh key={bead.id} position={bead.center} castShadow>
            <sphereGeometry args={[bead.diameterMm / 2, 14, 10]} />
            <MetalMaterial color={alloy.color} />
          </mesh>
        ))}
        {layout.stones.map((stone) => (
          <Gem key={stone.id} stone={stone} />
        ))}
      </group>
    </Float>
  )
}
