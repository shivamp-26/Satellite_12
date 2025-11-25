import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SatelliteData, calculateOrbitPath } from '@/lib/satellite-utils';
import { CollisionRisk, getRiskColor } from '@/lib/collision-detector';
import { getOrbitColor } from '@/lib/tle-parser';

interface Earth3DEnhancedProps {
  satellites: SatelliteData[];
  selectedSatellite: SatelliteData | null;
  onSelectSatellite: (sat: SatelliteData) => void;
  showOrbits: boolean;
  collisions: CollisionRisk[];
  orbitFilters: ('LEO' | 'MEO' | 'GEO' | 'HEO')[];
}

const EARTH_RADIUS = 6.371;
// Earth's sidereal rotation period is ~23h 56m = 86164 seconds
// We accelerate it for visualization (1 real second = 60 simulated seconds)
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 86164 * 60;
const CLOUD_ROTATION_SPEED = EARTH_ROTATION_SPEED * 1.1; // Clouds move slightly faster

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const nightRef = useRef<THREE.Mesh>(null);
  
  // Load real NASA textures
  const [dayTexture, bumpTexture, specularTexture, nightTexture, cloudTexture] = useLoader(
    THREE.TextureLoader,
    [
      '/textures/earth-blue-marble.jpg',
      '/textures/earth-bump.png',
      '/textures/earth-specular.png',
      '/textures/earth-night.jpg',
      '/textures/earth-clouds.png',
    ]
  );
  
  useFrame((state, delta) => {
    // Realistic Earth rotation (accelerated for visualization)
    if (meshRef.current) {
      meshRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += CLOUD_ROTATION_SPEED * delta;
    }
    if (nightRef.current) {
      nightRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
  });
  
  return (
    <group>
      {/* Earth day side with real textures */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial 
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          specularMap={specularTexture}
          specular={new THREE.Color(0x333333)}
          shininess={25}
        />
      </mesh>
      
      {/* Earth night side (city lights) - rendered on back side */}
      <mesh ref={nightRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.001, 128, 128]} />
        <meshBasicMaterial 
          map={nightTexture}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Cloud layer with real texture */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.01, 64, 64]} />
        <meshPhongMaterial 
          map={cloudTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.025, 64, 64]} />
        <meshBasicMaterial 
          color="#4da6ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer atmosphere glow - realistic blue haze */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.15, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{
            glowColor: { value: new THREE.Color(0x4da6ff) },
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.35);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function SatelliteMarker({ 
  data, 
  isSelected, 
  onClick,
}: { 
  data: SatelliteData; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  if (!data.position) return null;
  
  const orbitType = data.orbitType || 'LEO';
  const baseColor = getOrbitColor(orbitType);
  const color = isSelected ? '#ffffff' : baseColor;
  const size = isSelected ? 0.18 : hovered ? 0.15 : 0.1;
  
  return (
    <group position={[data.position.x, data.position.y, data.position.z]}>
      {/* Satellite sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isSelected ? 1 : 0.9}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent 
          opacity={0.2}
        />
      </mesh>
      
      {/* Tooltip on hover */}
      {hovered && !isSelected && (
        <Html distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 min-w-[160px] text-xs">
            <p className="font-bold text-foreground truncate">{data.name}</p>
            <p className="text-muted-foreground">NORAD: {data.noradId}</p>
            <p className="text-muted-foreground">Alt: {data.altitude?.toFixed(1)} km</p>
            <p style={{ color: baseColor }}>{orbitType}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function CollisionLine({ collision }: { collision: CollisionRisk }) {
  const points = useMemo(() => [
    new THREE.Vector3(collision.position1.x, collision.position1.y, collision.position1.z),
    new THREE.Vector3(collision.position2.x, collision.position2.y, collision.position2.z),
  ], [collision]);
  
  const color = getRiskColor(collision.riskLevel);
  const lineWidth = collision.riskLevel === 'critical' ? 3 : collision.riskLevel === 'high' ? 2 : 1;
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={0.8}
      dashed={collision.riskLevel !== 'critical'}
      dashSize={0.2}
      dashScale={2}
    />
  );
}

function OrbitPath({ satellite, date }: { satellite: SatelliteData; date: Date }) {
  const points = useMemo(() => {
    const path = calculateOrbitPath(satellite, date, 100);
    return path.map(p => new THREE.Vector3(p.x, p.y, p.z));
  }, [satellite, date]);
  
  if (points.length < 2) return null;
  
  const color = satellite.orbitType ? getOrbitColor(satellite.orbitType) : '#00d4ff';
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  );
}

function Scene({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  showOrbits,
  collisions,
}: Omit<Earth3DEnhancedProps, 'orbitFilters'>) {
  const { camera } = useThree();
  const currentDate = useRef(new Date());
  
  useEffect(() => {
    camera.position.set(0, 10, 25);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[50, 30, 50]} intensity={1.2} color="#fff5e6" />
      <directionalLight position={[-30, -20, -30]} intensity={0.3} color="#00d4ff" />
      <pointLight position={[0, 0, 0]} intensity={0.1} color="#ffaa44" />
      
      <Stars 
        radius={200} 
        depth={100} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.3}
      />
      
      <Earth />
      
      {/* Satellites */}
      {satellites.map((sat) => (
        <SatelliteMarker
          key={sat.id}
          data={sat}
          isSelected={selectedSatellite?.id === sat.id}
          onClick={() => onSelectSatellite(sat)}
        />
      ))}
      
      {/* Selected satellite orbit */}
      {showOrbits && selectedSatellite && (
        <OrbitPath satellite={selectedSatellite} date={currentDate.current} />
      )}
      
      {/* Collision warning lines */}
      {collisions.map((collision) => (
        <CollisionLine key={collision.id} collision={collision} />
      ))}
      
      <OrbitControls 
        enablePan={false}
        minDistance={10}
        maxDistance={80}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
    </>
  );
}

export default function Earth3DEnhanced(props: Earth3DEnhancedProps) {
  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden">
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
