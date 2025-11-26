import { useMemo, useRef, useEffect } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface DayNightTerminatorProps {
  currentTime: Date;
  earthRadius: number;
}

export default function DayNightTerminator({ currentTime, earthRadius }: DayNightTerminatorProps) {
  const { sunDirection, terminatorPoints } = useMemo(() => {
    // Calculate sun position based on time
    const dayOfYear = getDayOfYear(currentTime);
    const hourUTC = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
    
    // Solar declination (simplified)
    const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
    const declinationRad = declination * (Math.PI / 180);
    
    // Hour angle (sun position based on time)
    const hourAngle = (hourUTC - 12) * 15 * (Math.PI / 180);
    
    // Sun direction vector
    const sunDir = new THREE.Vector3(
      -Math.cos(declinationRad) * Math.sin(hourAngle),
      Math.sin(declinationRad),
      -Math.cos(declinationRad) * Math.cos(hourAngle)
    ).normalize();
    
    // Calculate terminator circle points
    const points: THREE.Vector3[] = [];
    const segments = 64;
    
    // Get perpendicular vectors to create terminator plane
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, sunDir).normalize();
    const actualUp = new THREE.Vector3().crossVectors(sunDir, right).normalize();
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const point = new THREE.Vector3()
        .addScaledVector(right, Math.cos(angle) * earthRadius * 1.002)
        .addScaledVector(actualUp, Math.sin(angle) * earthRadius * 1.002);
      points.push(point);
    }
    
    return { sunDirection: sunDir, terminatorPoints: points };
  }, [currentTime, earthRadius]);
  
  const sunPosition = useMemo(() => 
    sunDirection.clone().multiplyScalar(earthRadius * 3),
    [sunDirection, earthRadius]
  );
  
  return (
    <group>
      {/* Terminator line using drei Line component */}
      <Line
        points={terminatorPoints}
        color="#ff6b35"
        lineWidth={2}
        transparent
        opacity={0.8}
      />
      
      {/* Sun indicator - distant light source direction */}
      <mesh position={sunPosition}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffdd44" />
      </mesh>
      
      {/* Sun glow */}
      <mesh position={sunPosition}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
