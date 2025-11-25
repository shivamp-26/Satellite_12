import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SatelliteData, calculateOrbitPath, propagateSatellite } from '@/lib/satellite-utils';
import { CollisionRisk, getRiskColor } from '@/lib/collision-detector';
import { getOrbitColor } from '@/lib/tle-parser';
import SatelliteTrail from './SatelliteTrail';
import DayNightTerminator from './DayNightTerminator';

interface Earth3DEnhancedProps {
  satellites: SatelliteData[];
  selectedSatellite: SatelliteData | null;
  onSelectSatellite: (sat: SatelliteData) => void;
  showOrbits: boolean;
  collisions: CollisionRisk[];
  orbitFilters: ('LEO' | 'MEO' | 'GEO' | 'HEO')[];
  currentTime: Date;
  showTrails: boolean;
  showTerminator: boolean;
}

const EARTH_RADIUS = 6.371;

function Earth({ currentTime }: { currentTime: Date }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const nightRef = useRef<THREE.Mesh>(null);
  
  const [dayTexture, bumpTexture, specularTexture, nightTexture, cloudTexture] = useLoader(
    THREE.TextureLoader,
    ['/textures/earth-blue-marble.jpg', '/textures/earth-bump.png', '/textures/earth-specular.png', '/textures/earth-night.jpg', '/textures/earth-clouds.png']
  );
  
  const baseRotation = useMemo(() => {
    const hourUTC = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
    return (hourUTC / 24) * Math.PI * 2;
  }, [currentTime]);
  
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y = baseRotation;
    if (cloudsRef.current) cloudsRef.current.rotation.y = baseRotation * 1.05;
    if (nightRef.current) nightRef.current.rotation.y = baseRotation;
  });
  
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial map={dayTexture} bumpMap={bumpTexture} bumpScale={0.05} specularMap={specularTexture} specular={new THREE.Color(0x333333)} shininess={25} />
      </mesh>
      <mesh ref={nightRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.001, 128, 128]} />
        <meshBasicMaterial map={nightTexture} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.01, 64, 64]} />
        <meshPhongMaterial map={cloudTexture} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.025, 64, 64]} />
        <meshBasicMaterial color="#4da6ff" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function SatelliteMarker({ data, isSelected, onClick, currentTime }: { data: SatelliteData; isSelected: boolean; onClick: () => void; currentTime: Date }) {
  const [hovered, setHovered] = useState(false);
  const position = useMemo(() => propagateSatellite(data, currentTime).position, [data, currentTime]);
  if (!position) return null;
  const orbitType = data.orbitType || 'LEO';
  const baseColor = getOrbitColor(orbitType);
  const color = isSelected ? '#ffffff' : baseColor;
  const size = isSelected ? 0.18 : hovered ? 0.15 : 0.1;
  
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 1 : 0.9} />
      </mesh>
      <mesh><sphereGeometry args={[size * 1.5, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={0.2} /></mesh>
      {hovered && !isSelected && (
        <Html distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 min-w-[180px] text-xs">
            <p className="font-bold text-foreground truncate">{data.name}</p>
            <p className="text-muted-foreground">NORAD: {data.noradId}</p>
            {data.country && <p className="text-muted-foreground">Country: {data.country}</p>}
            <p style={{ color: baseColor }}>{orbitType}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function CollisionLine({ collision }: { collision: CollisionRisk }) {
  const points = useMemo(() => [new THREE.Vector3(collision.position1.x, collision.position1.y, collision.position1.z), new THREE.Vector3(collision.position2.x, collision.position2.y, collision.position2.z)], [collision]);
  return <Line points={points} color={getRiskColor(collision.riskLevel)} lineWidth={collision.riskLevel === 'critical' ? 3 : 1} transparent opacity={0.8} />;
}

function OrbitPath({ satellite, date }: { satellite: SatelliteData; date: Date }) {
  const points = useMemo(() => calculateOrbitPath(satellite, date, 100).map(p => new THREE.Vector3(p.x, p.y, p.z)), [satellite, date]);
  if (points.length < 2) return null;
  return <Line points={points} color={satellite.orbitType ? getOrbitColor(satellite.orbitType) : '#00d4ff'} lineWidth={1} transparent opacity={0.5} />;
}

function Scene({ satellites, selectedSatellite, onSelectSatellite, showOrbits, collisions, currentTime, showTrails, showTerminator }: Omit<Earth3DEnhancedProps, 'orbitFilters'>) {
  const { camera } = useThree();
  useEffect(() => { camera.position.set(0, 10, 25); }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[50, 30, 50]} intensity={1.2} color="#fff5e6" />
      <Stars radius={200} depth={100} count={5000} factor={4} saturation={0} fade speed={0.3} />
      <Earth currentTime={currentTime} />
      {showTerminator && <DayNightTerminator currentTime={currentTime} earthRadius={EARTH_RADIUS} />}
      {satellites.map((sat) => <SatelliteMarker key={sat.id} data={sat} isSelected={selectedSatellite?.id === sat.id} onClick={() => onSelectSatellite(sat)} currentTime={currentTime} />)}
      {showTrails && selectedSatellite && <SatelliteTrail satellite={selectedSatellite} currentTime={currentTime} trailMinutes={30} trailPoints={60} />}
      {showOrbits && selectedSatellite && <OrbitPath satellite={selectedSatellite} date={currentTime} />}
      {collisions.map((c) => <CollisionLine key={c.id} collision={c} />)}
      <OrbitControls enablePan={false} minDistance={10} maxDistance={80} enableDamping dampingFactor={0.05} rotateSpeed={0.5} />
    </>
  );
}

export default function Earth3DEnhanced(props: Earth3DEnhancedProps) {
  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden">
      <Canvas camera={{ fov: 45, near: 0.1, far: 1000 }} gl={{ antialias: true, alpha: true }}>
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
