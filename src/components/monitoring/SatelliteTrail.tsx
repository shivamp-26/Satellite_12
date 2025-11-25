import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { SatelliteData, propagateSatellite } from '@/lib/satellite-utils';
import { getOrbitColor } from '@/lib/tle-parser';

interface SatelliteTrailProps {
  satellite: SatelliteData;
  currentTime: Date;
  trailMinutes: number;
  trailPoints: number;
}

export default function SatelliteTrail({
  satellite,
  currentTime,
  trailMinutes = 30,
  trailPoints = 60,
}: SatelliteTrailProps) {
  const { points, colors } = useMemo(() => {
    const trailData: THREE.Vector3[] = [];
    const colorData: THREE.Color[] = [];
    
    const color = new THREE.Color(satellite.orbitType ? getOrbitColor(satellite.orbitType) : '#00d4ff');
    const msPerPoint = (trailMinutes * 60 * 1000) / trailPoints;
    
    for (let i = trailPoints; i >= 0; i--) {
      const time = new Date(currentTime.getTime() - i * msPerPoint);
      const propagated = propagateSatellite(satellite, time);
      
      if (propagated.position) {
        trailData.push(new THREE.Vector3(
          propagated.position.x,
          propagated.position.y,
          propagated.position.z
        ));
        
        // Fade opacity from trail end to current position
        const alpha = 1 - (i / trailPoints);
        const fadedColor = new THREE.Color().copy(color);
        colorData.push(fadedColor);
      }
    }
    
    return { points: trailData, colors: colorData };
  }, [satellite, currentTime, trailMinutes, trailPoints]);
  
  if (points.length < 2) return null;
  
  return (
    <Line
      points={points}
      color={satellite.orbitType ? getOrbitColor(satellite.orbitType) : '#00d4ff'}
      lineWidth={1.5}
      transparent
      opacity={0.6}
    />
  );
}
