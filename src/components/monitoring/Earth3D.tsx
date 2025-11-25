import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { SatelliteData, DebrisData, calculateOrbitPath } from '@/lib/satellite-utils';

interface Earth3DProps {
  satellites: SatelliteData[];
  debris: DebrisData[];
  selectedSatellite: SatelliteData | null;
  onSelectSatellite: (sat: SatelliteData) => void;
  showOrbits: boolean;
  showDebris: boolean;
  satelliteStyle: 'dot' | 'sphere';
}

const EARTH_RADIUS = 6.371; // Scaled Earth radius

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create a gradient for ocean
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.5, '#0d2847');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Add some continent-like shapes
    ctx.fillStyle = '#1a3a5c';
    ctx.beginPath();
    ctx.ellipse(150, 100, 60, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(350, 120, 80, 50, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(400, 180, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(100, 180, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });
  
  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={texture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.02, 64, 64]} />
        <meshBasicMaterial 
          color="#00d4ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Grid lines */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[EARTH_RADIUS * 1.001, 36, 18]} />
        <meshBasicMaterial 
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

function Satellite({ 
  data, 
  isSelected, 
  onClick, 
  style 
}: { 
  data: SatelliteData; 
  isSelected: boolean; 
  onClick: () => void;
  style: 'dot' | 'sphere';
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  if (!data.position) return null;
  
  const color = isSelected ? '#ff6b6b' : '#00d4ff';
  const size = style === 'sphere' ? 0.15 : 0.08;
  
  return (
    <mesh
      ref={meshRef}
      position={[data.position.x, data.position.y, data.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {style === 'sphere' ? (
        <sphereGeometry args={[size, 16, 16]} />
      ) : (
        <sphereGeometry args={[size, 8, 8]} />
      )}
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={isSelected ? 1 : 0.8}
      />
    </mesh>
  );
}

function DebrisField({ debris }: { debris: DebrisData[] }) {
  const points = useMemo(() => {
    const positions: number[] = [];
    debris.forEach((d) => {
      if (d.position) {
        positions.push(d.position.x, d.position.y, d.position.z);
      }
    });
    return new Float32Array(positions);
  }, [debris]);
  
  if (points.length === 0) return null;
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#ff4444"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function OrbitPath({ satellite, date }: { satellite: SatelliteData; date: Date }) {
  const points = useMemo(() => {
    const path = calculateOrbitPath(satellite, date, 100);
    return path.map(p => new THREE.Vector3(p.x, p.y, p.z));
  }, [satellite, date]);
  
  if (points.length < 2) return null;
  
  return (
    <Line
      points={points}
      color="#00d4ff"
      lineWidth={1}
      transparent
      opacity={0.4}
    />
  );
}

function Scene({
  satellites,
  debris,
  selectedSatellite,
  onSelectSatellite,
  showOrbits,
  showDebris,
  satelliteStyle,
}: Earth3DProps) {
  const { camera } = useThree();
  const currentDate = useRef(new Date());
  
  useEffect(() => {
    camera.position.set(0, 10, 25);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00d4ff" />
      
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      <Earth />
      
      {satellites.map((sat) => (
        <Satellite
          key={sat.id}
          data={sat}
          isSelected={selectedSatellite?.id === sat.id}
          onClick={() => onSelectSatellite(sat)}
          style={satelliteStyle}
        />
      ))}
      
      {showOrbits && selectedSatellite && (
        <OrbitPath satellite={selectedSatellite} date={currentDate.current} />
      )}
      
      {showDebris && <DebrisField debris={debris} />}
      
      <OrbitControls 
        enablePan={false}
        minDistance={10}
        maxDistance={50}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Earth3D(props: Earth3DProps) {
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
