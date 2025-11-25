import { SatelliteData, propagateSatellite } from './satellite-utils';

export interface CollisionRisk {
  id: string;
  sat1: SatelliteData;
  sat2: SatelliteData;
  distance: number;
  timeOfClosestApproach: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  position1: { x: number; y: number; z: number };
  position2: { x: number; y: number; z: number };
}

const SCALE_FACTOR = 1 / 1000;

export function detectRealTimeCollisions(
  satellites: SatelliteData[],
  thresholdKm: number = 50
): CollisionRisk[] {
  const collisions: CollisionRisk[] = [];
  const now = new Date();
  
  // Check all pairs
  for (let i = 0; i < satellites.length; i++) {
    for (let j = i + 1; j < satellites.length; j++) {
      const sat1 = satellites[i];
      const sat2 = satellites[j];
      
      if (!sat1.position || !sat2.position) continue;
      
      // Calculate distance in km
      const dx = (sat1.position.x - sat2.position.x) / SCALE_FACTOR;
      const dy = (sat1.position.y - sat2.position.y) / SCALE_FACTOR;
      const dz = (sat1.position.z - sat2.position.z) / SCALE_FACTOR;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < thresholdKm) {
        const riskLevel = getRiskLevel(distance);
        
        collisions.push({
          id: `${sat1.id}-${sat2.id}`,
          sat1,
          sat2,
          distance: Math.round(distance * 100) / 100,
          timeOfClosestApproach: now,
          riskLevel,
          position1: sat1.position,
          position2: sat2.position,
        });
      }
    }
  }
  
  return collisions.sort((a, b) => a.distance - b.distance);
}

export function predictCollisions24Hours(
  satellites: SatelliteData[],
  thresholdKm: number = 50
): CollisionRisk[] {
  const collisions: CollisionRisk[] = [];
  const now = new Date();
  const steps = 96; // Every 15 minutes for 24 hours
  const stepMs = (24 * 60 * 60 * 1000) / steps;
  
  // For performance, limit satellite pairs
  const maxPairs = 10000;
  let pairCount = 0;
  
  for (let i = 0; i < satellites.length && pairCount < maxPairs; i++) {
    for (let j = i + 1; j < satellites.length && pairCount < maxPairs; j++) {
      pairCount++;
      
      const sat1 = satellites[i];
      const sat2 = satellites[j];
      
      if (!sat1.satrec || !sat2.satrec) continue;
      
      let minDistance = Infinity;
      let closestTime = now;
      let closestPos1 = sat1.position;
      let closestPos2 = sat2.position;
      
      // Check each time step
      for (let k = 0; k < steps; k++) {
        const time = new Date(now.getTime() + k * stepMs);
        
        const prop1 = propagateSatellite(sat1, time);
        const prop2 = propagateSatellite(sat2, time);
        
        if (!prop1.position || !prop2.position) continue;
        
        const dx = (prop1.position.x - prop2.position.x) / SCALE_FACTOR;
        const dy = (prop1.position.y - prop2.position.y) / SCALE_FACTOR;
        const dz = (prop1.position.z - prop2.position.z) / SCALE_FACTOR;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestTime = time;
          closestPos1 = prop1.position;
          closestPos2 = prop2.position;
        }
      }
      
      if (minDistance < thresholdKm && closestPos1 && closestPos2) {
        collisions.push({
          id: `${sat1.id}-${sat2.id}-pred`,
          sat1,
          sat2,
          distance: Math.round(minDistance * 100) / 100,
          timeOfClosestApproach: closestTime,
          riskLevel: getRiskLevel(minDistance),
          position1: closestPos1,
          position2: closestPos2,
        });
      }
    }
  }
  
  return collisions.sort((a, b) => a.distance - b.distance).slice(0, 50);
}

function getRiskLevel(distanceKm: number): 'low' | 'medium' | 'high' | 'critical' {
  if (distanceKm <= 1) return 'critical';
  if (distanceKm <= 10) return 'high';
  if (distanceKm <= 25) return 'medium';
  return 'low';
}

export function getRiskColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (riskLevel) {
    case 'critical': return '#ff0000';
    case 'high': return '#ff4444';
    case 'medium': return '#ffaa00';
    case 'low': return '#ffdd00';
  }
}
