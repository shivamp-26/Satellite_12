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
  // Enhanced fields
  collisionProbability?: number; // 0-100%
  relativeVelocity?: number; // km/s
  positionUncertainty1?: number; // km
  positionUncertainty2?: number; // km
  tleAge1?: number; // hours
  tleAge2?: number; // hours
  missDistanceRadial?: number; // km
  missDistanceInTrack?: number; // km
  missDistanceCrossTrack?: number; // km
}

const SCALE_FACTOR = 1 / 1000;
const COLLISION_RADIUS = 0.01; // 10m combined object radius in km

// Extract TLE epoch from satrec
function getTleEpochDate(sat: SatelliteData): Date | null {
  if (!sat.satrec) return null;
  
  const satrec = sat.satrec as any;
  const epochYear = satrec.epochyr;
  const epochDays = satrec.epochdays;
  
  // Convert to full year
  const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
  
  // Create date from year and day of year
  const epochDate = new Date(Date.UTC(fullYear, 0, 1));
  epochDate.setTime(epochDate.getTime() + (epochDays - 1) * 24 * 60 * 60 * 1000);
  
  return epochDate;
}

// Calculate TLE age in hours
function calculateTleAge(sat: SatelliteData, currentTime: Date): number {
  const epochDate = getTleEpochDate(sat);
  if (!epochDate) return 168; // Default to 7 days if unknown
  
  const ageMs = currentTime.getTime() - epochDate.getTime();
  return Math.max(0, ageMs / (1000 * 60 * 60)); // hours
}

// Position uncertainty model based on TLE age and orbit type
function calculatePositionUncertainty(
  tleAgeHours: number,
  altitude: number, // km
  propagationTimeHours: number
): number {
  // Base uncertainty from TLE accuracy
  let baseUncertainty = 0.5; // km for fresh TLE
  
  // TLE age factor (uncertainty grows with age)
  const tleAgeDays = tleAgeHours / 24;
  const tleAgeFactor = 1 + tleAgeDays * 0.5; // 50% increase per day
  
  // Orbit-dependent growth rate
  let growthRate: number;
  if (altitude < 600) {
    // LEO - high atmospheric drag uncertainty
    growthRate = 3.0; // km/day
  } else if (altitude < 2000) {
    // LEO-MEO transition
    growthRate = 1.5; // km/day
  } else if (altitude < 35000) {
    // MEO
    growthRate = 0.5; // km/day
  } else {
    // GEO
    growthRate = 0.2; // km/day
  }
  
  // Calculate total uncertainty
  const propagationDays = propagationTimeHours / 24;
  const uncertainty = (baseUncertainty * tleAgeFactor) + (propagationDays * growthRate);
  
  return Math.min(uncertainty, 100); // Cap at 100 km
}

// Collision probability calculation using simplified 2D encounter model
function calculateCollisionProbability(
  missDistance: number, // km
  sigma1: number, // km - position uncertainty of sat1
  sigma2: number // km - position uncertainty of sat2
): number {
  // Combined position uncertainty
  const sigmaCombined = Math.sqrt(sigma1 * sigma1 + sigma2 * sigma2);
  
  if (sigmaCombined < 0.001) return 0; // Avoid division by zero
  
  // Simplified probability formula
  // Pc = (π * r²) / (2π * σ²) * exp(-d² / (2σ²))
  // Simplified: Pc ≈ (r² / (2 * σ²)) * exp(-d² / (2σ²))
  
  const r2 = COLLISION_RADIUS * COLLISION_RADIUS;
  const sigma2Combined = sigmaCombined * sigmaCombined;
  const d2 = missDistance * missDistance;
  
  const probability = (r2 / (2 * sigma2Combined)) * Math.exp(-d2 / (2 * sigma2Combined));
  
  // Convert to percentage, cap at 100%
  return Math.min(probability * 100, 100);
}

// Calculate relative velocity at TCA
function calculateRelativeVelocity(
  sat1: SatelliteData,
  sat2: SatelliteData
): number {
  if (!sat1.velocity || !sat2.velocity) return 0;
  
  // Velocity is in km/s (after scaling)
  const dvx = (sat1.velocity.x - sat2.velocity.x) / SCALE_FACTOR;
  const dvy = (sat1.velocity.y - sat2.velocity.y) / SCALE_FACTOR;
  const dvz = (sat1.velocity.z - sat2.velocity.z) / SCALE_FACTOR;
  
  return Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
}

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
        
        // Calculate enhanced metrics
        const tleAge1 = calculateTleAge(sat1, now);
        const tleAge2 = calculateTleAge(sat2, now);
        const altitude1 = sat1.altitude || 400;
        const altitude2 = sat2.altitude || 400;
        const uncertainty1 = calculatePositionUncertainty(tleAge1, altitude1, 0);
        const uncertainty2 = calculatePositionUncertainty(tleAge2, altitude2, 0);
        const probability = calculateCollisionProbability(distance, uncertainty1, uncertainty2);
        const relativeVelocity = calculateRelativeVelocity(sat1, sat2);
        
        collisions.push({
          id: `${sat1.id}-${sat2.id}`,
          sat1,
          sat2,
          distance: Math.round(distance * 100) / 100,
          timeOfClosestApproach: now,
          riskLevel,
          position1: sat1.position,
          position2: sat2.position,
          collisionProbability: probability,
          relativeVelocity: Math.round(relativeVelocity * 1000) / 1000,
          positionUncertainty1: Math.round(uncertainty1 * 100) / 100,
          positionUncertainty2: Math.round(uncertainty2 * 100) / 100,
          tleAge1: Math.round(tleAge1 * 10) / 10,
          tleAge2: Math.round(tleAge2 * 10) / 10,
        });
      }
    }
  }
  
  return collisions.sort((a, b) => a.distance - b.distance);
}

// Two-phase collision prediction with fine time steps
export function predictCollisions24Hours(
  satellites: SatelliteData[],
  thresholdKm: number = 50
): CollisionRisk[] {
  const candidates: Map<string, {
    sat1: SatelliteData;
    sat2: SatelliteData;
    coarseMinDistance: number;
    coarseTime: Date;
  }> = new Map();
  
  const now = new Date();
  const screeningThreshold = 100; // km - wider threshold for Phase 1
  
  // === PHASE 1: Coarse Scan (15-minute intervals) ===
  const coarseSteps = 96; // Every 15 minutes for 24 hours
  const coarseStepMs = (24 * 60 * 60 * 1000) / coarseSteps;
  
  // Limit satellite pairs for performance
  const maxPairs = 10000;
  let pairCount = 0;
  
  for (let i = 0; i < satellites.length && pairCount < maxPairs; i++) {
    for (let j = i + 1; j < satellites.length && pairCount < maxPairs; j++) {
      pairCount++;
      
      const sat1 = satellites[i];
      const sat2 = satellites[j];
      
      if (!sat1.satrec || !sat2.satrec) continue;
      
      let minDistance = Infinity;
      let minTime = now;
      
      // Coarse scan
      for (let k = 0; k < coarseSteps; k++) {
        const time = new Date(now.getTime() + k * coarseStepMs);
        
        const prop1 = propagateSatellite(sat1, time);
        const prop2 = propagateSatellite(sat2, time);
        
        if (!prop1.position || !prop2.position) continue;
        
        const dx = (prop1.position.x - prop2.position.x) / SCALE_FACTOR;
        const dy = (prop1.position.y - prop2.position.y) / SCALE_FACTOR;
        const dz = (prop1.position.z - prop2.position.z) / SCALE_FACTOR;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < minDistance) {
          minDistance = distance;
          minTime = time;
        }
      }
      
      // Add to candidates if within screening threshold
      if (minDistance < screeningThreshold) {
        const pairId = `${sat1.id}-${sat2.id}`;
        candidates.set(pairId, {
          sat1,
          sat2,
          coarseMinDistance: minDistance,
          coarseTime: minTime,
        });
      }
    }
  }
  
  // === PHASE 2: Fine Refinement ===
  const collisions: CollisionRisk[] = [];
  
  for (const [pairId, candidate] of candidates) {
    const { sat1, sat2, coarseTime } = candidate;
    
    // Refine with 1-minute intervals (±30 minutes around coarse minimum)
    let minDistance = Infinity;
    let minTime = coarseTime;
    let minProp1: SatelliteData | null = null;
    let minProp2: SatelliteData | null = null;
    
    const refineWindowMs = 30 * 60 * 1000; // ±30 minutes
    const fineStepMs = 60 * 1000; // 1 minute
    
    for (let t = -refineWindowMs; t <= refineWindowMs; t += fineStepMs) {
      const time = new Date(coarseTime.getTime() + t);
      
      const prop1 = propagateSatellite(sat1, time);
      const prop2 = propagateSatellite(sat2, time);
      
      if (!prop1.position || !prop2.position) continue;
      
      const dx = (prop1.position.x - prop2.position.x) / SCALE_FACTOR;
      const dy = (prop1.position.y - prop2.position.y) / SCALE_FACTOR;
      const dz = (prop1.position.z - prop2.position.z) / SCALE_FACTOR;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < minDistance) {
        minDistance = distance;
        minTime = time;
        minProp1 = prop1;
        minProp2 = prop2;
      }
    }
    
    // Further refine with 10-second intervals for close approaches (<10km)
    if (minDistance < 10 && minProp1 && minProp2) {
      const finerWindowMs = 5 * 60 * 1000; // ±5 minutes
      const finerStepMs = 10 * 1000; // 10 seconds
      const finerCenterTime = minTime;
      
      for (let t = -finerWindowMs; t <= finerWindowMs; t += finerStepMs) {
        const time = new Date(finerCenterTime.getTime() + t);
        
        const prop1 = propagateSatellite(sat1, time);
        const prop2 = propagateSatellite(sat2, time);
        
        if (!prop1.position || !prop2.position) continue;
        
        const dx = (prop1.position.x - prop2.position.x) / SCALE_FACTOR;
        const dy = (prop1.position.y - prop2.position.y) / SCALE_FACTOR;
        const dz = (prop1.position.z - prop2.position.z) / SCALE_FACTOR;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < minDistance) {
          minDistance = distance;
          minTime = time;
          minProp1 = prop1;
          minProp2 = prop2;
        }
      }
    }
    
    // Finest refinement with 1-second intervals for critical approaches (<1km)
    if (minDistance < 1 && minProp1 && minProp2) {
      const finestWindowMs = 60 * 1000; // ±1 minute
      const finestStepMs = 1000; // 1 second
      const finestCenterTime = minTime;
      
      for (let t = -finestWindowMs; t <= finestWindowMs; t += finestStepMs) {
        const time = new Date(finestCenterTime.getTime() + t);
        
        const prop1 = propagateSatellite(sat1, time);
        const prop2 = propagateSatellite(sat2, time);
        
        if (!prop1.position || !prop2.position) continue;
        
        const dx = (prop1.position.x - prop2.position.x) / SCALE_FACTOR;
        const dy = (prop1.position.y - prop2.position.y) / SCALE_FACTOR;
        const dz = (prop1.position.z - prop2.position.z) / SCALE_FACTOR;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < minDistance) {
          minDistance = distance;
          minTime = time;
          minProp1 = prop1;
          minProp2 = prop2;
        }
      }
    }
    
    // Only include if within final threshold
    if (minDistance < thresholdKm && minProp1 && minProp2) {
      // Calculate enhanced metrics
      const propagationHours = (minTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const tleAge1 = calculateTleAge(sat1, now);
      const tleAge2 = calculateTleAge(sat2, now);
      const altitude1 = minProp1.altitude || 400;
      const altitude2 = minProp2.altitude || 400;
      const uncertainty1 = calculatePositionUncertainty(tleAge1, altitude1, propagationHours);
      const uncertainty2 = calculatePositionUncertainty(tleAge2, altitude2, propagationHours);
      const probability = calculateCollisionProbability(minDistance, uncertainty1, uncertainty2);
      const relativeVelocity = calculateRelativeVelocity(minProp1, minProp2);
      
      collisions.push({
        id: `${sat1.id}-${sat2.id}-pred`,
        sat1,
        sat2,
        distance: Math.round(minDistance * 100) / 100,
        timeOfClosestApproach: minTime,
        riskLevel: getRiskLevel(minDistance),
        position1: minProp1.position!,
        position2: minProp2.position!,
        collisionProbability: probability,
        relativeVelocity: Math.round(relativeVelocity * 1000) / 1000,
        positionUncertainty1: Math.round(uncertainty1 * 100) / 100,
        positionUncertainty2: Math.round(uncertainty2 * 100) / 100,
        tleAge1: Math.round(tleAge1 * 10) / 10,
        tleAge2: Math.round(tleAge2 * 10) / 10,
      });
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

// Get probability color for UI
export function getProbabilityColor(probability: number): string {
  if (probability >= 1) return '#ff0000'; // Critical: >= 1%
  if (probability >= 0.1) return '#ff4444'; // High: >= 0.1%
  if (probability >= 0.01) return '#ffaa00'; // Medium: >= 0.01%
  return '#ffdd00'; // Low
}

// Format probability for display
export function formatProbability(probability: number): string {
  if (probability >= 1) return probability.toFixed(1) + '%';
  if (probability >= 0.01) return probability.toFixed(2) + '%';
  if (probability >= 0.0001) return (probability * 10000).toFixed(1) + '×10⁻⁴';
  return '< 10⁻⁴';
}
