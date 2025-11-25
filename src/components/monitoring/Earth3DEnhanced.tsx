import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Deep ocean gradient
    const gradient = ctx.createRadialGradient(512, 256, 0, 512, 256, 512);
    gradient.addColorStop(0, '#0a2040');
    gradient.addColorStop(0.5, '#061830');
    gradient.addColorStop(1, '#040d1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Continental shapes with more detail
    ctx.fillStyle = '#1a4060';
    
    // North America
    ctx.beginPath();
    ctx.ellipse(200, 150, 100, 70, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(280, 320, 50, 90, 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(520, 200, 80, 150, 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(750, 180, 150, 100, -0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(820, 350, 60, 45, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some city lights effect
    ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0003;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0003;
    }
  });
  
  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial 
          map={texture}
          shininess={5}
          specular={new THREE.Color(0x111111)}
        />
      </mesh>
      
      {/* Inner atmosphere glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.01, 64, 64]} />
        <meshBasicMaterial 
          color="#00aaff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.15, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color(0x00d4ff) },
            viewVector: { value: new THREE.Vector3(0, 0, 1) },
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
              gl_FragColor = vec4(0.0, 0.83, 1.0, intensity * 0.3);
            }
          `}
        />
      </mesh>
      
      {/* Grid lines */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.002, 36, 18]} />
        <meshBasicMaterial 
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.03}
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
