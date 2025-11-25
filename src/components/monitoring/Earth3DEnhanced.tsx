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
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  // Create realistic Earth texture
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // Deep ocean base with realistic gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGradient.addColorStop(0, '#0c1a2e');
    oceanGradient.addColorStop(0.3, '#0a2540');
    oceanGradient.addColorStop(0.5, '#0d3050');
    oceanGradient.addColorStop(0.7, '#0a2540');
    oceanGradient.addColorStop(1, '#0c1a2e');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Add ocean depth variation
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 200 + 50;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, 'rgba(10, 40, 70, 0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    
    // Continents with realistic coloring
    const drawContinent = (points: number[][], baseColor: string, highlightColor: string) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(
        points[0][0], points[0][1], 0,
        points[0][0], points[0][1], 300
      );
      gradient.addColorStop(0, highlightColor);
      gradient.addColorStop(1, baseColor);
      ctx.fillStyle = gradient;
      ctx.fill();
    };
    
    // North America
    drawContinent([
      [150, 80], [300, 100], [380, 180], [350, 280], [280, 320],
      [200, 300], [150, 250], [100, 180], [120, 120]
    ], '#1a4a35', '#2d6b4a');
    
    // South America
    drawContinent([
      [280, 340], [340, 360], [360, 450], [340, 550], [300, 620],
      [260, 580], [250, 480], [260, 400]
    ], '#1f5540', '#2a6b52');
    
    // Europe
    drawContinent([
      [480, 100], [600, 80], [650, 120], [620, 200], [550, 220],
      [500, 200], [470, 150]
    ], '#2a5545', '#3a7060');
    
    // Africa
    drawContinent([
      [500, 240], [600, 220], [680, 280], [700, 400], [660, 520],
      [580, 550], [520, 480], [500, 380], [480, 300]
    ], '#3d5a40', '#4d7050');
    
    // Asia
    drawContinent([
      [650, 100], [900, 80], [1000, 120], [1050, 200], [1000, 280],
      [900, 320], [800, 300], [700, 260], [680, 180], [700, 120]
    ], '#2a5040', '#3a6555');
    
    // India
    drawContinent([
      [780, 280], [840, 260], [860, 340], [820, 400], [780, 380], [760, 320]
    ], '#355545', '#457055');
    
    // Southeast Asia
    drawContinent([
      [880, 300], [950, 280], [980, 340], [940, 420], [880, 400], [860, 350]
    ], '#2d5842', '#3d7058');
    
    // Australia
    drawContinent([
      [920, 480], [1020, 460], [1080, 500], [1060, 580], [980, 620],
      [920, 580], [900, 520]
    ], '#4a5535', '#5a6545');
    
    // Antarctica
    ctx.fillStyle = '#e8f0f8';
    ctx.beginPath();
    ctx.ellipse(1024, 980, 800, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Arctic
    ctx.fillStyle = '#dde8f0';
    ctx.beginPath();
    ctx.ellipse(1024, 30, 600, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Mountain ranges (lighter areas)
    const drawMountains = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(80, 90, 70, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    };
    
    // Rockies
    drawMountains(200, 200, 20, 80);
    // Andes
    drawMountains(300, 480, 15, 120);
    // Alps
    drawMountains(540, 180, 30, 15);
    // Himalayas
    drawMountains(820, 240, 60, 20);
    
    // City lights effect (night side would show these)
    ctx.fillStyle = 'rgba(255, 220, 150, 0.6)';
    const cityLocations = [
      [200, 220], [280, 200], [180, 280], // North America
      [300, 420], [320, 500], // South America
      [530, 160], [560, 180], [600, 150], // Europe
      [540, 320], [580, 400], // Africa
      [800, 200], [850, 220], [900, 180], [780, 320], // Asia
      [960, 520], [1000, 540], // Australia
    ];
    
    cityLocations.forEach(([x, y]) => {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    return new THREE.CanvasTexture(canvas);
  }, []);
  
  // Cloud layer texture
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Generate cloud patterns
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 100 + 30;
      const opacity = Math.random() * 0.3 + 0.1;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.02;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = time * 0.025;
    }
  });
  
  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial 
          map={earthTexture}
          shininess={15}
          specular={new THREE.Color(0x333333)}
          bumpScale={0.05}
        />
      </mesh>
      
      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.008, 64, 64]} />
        <meshPhongMaterial 
          map={cloudTexture}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner atmosphere glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.02, 64, 64]} />
        <meshBasicMaterial 
          color="#4da6ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer atmosphere glow - blue haze */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.12, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{
            glowColor: { value: new THREE.Color(0x4da6ff) },
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.3, 0.65, 1.0, intensity * 0.4);
            }
          `}
        />
      </mesh>
      
      {/* Subtle grid overlay */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.003, 72, 36]} />
        <meshBasicMaterial 
          color="#4da6ff"
          wireframe
          transparent
          opacity={0.02}
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
