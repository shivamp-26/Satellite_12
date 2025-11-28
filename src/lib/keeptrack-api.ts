// KeepTrack API service for collision detection data

export interface KeepTrackCollision {
  ID: number;
  SAT1: string;
  SAT1_NAME: string;
  SAT1_STATUS: string;
  SAT2: string;
  SAT2_NAME: string;
  SAT2_STATUS: string;
  SAT1_AGE_OF_TLE: number; // days
  SAT2_AGE_OF_TLE: number; // days
  TOCA: string; // ISO date string - Time of Closest Approach
  MIN_RNG: number; // km - Minimum Range
  DILUTION_THRESHOLD: number;
  REL_SPEED: number; // km/s - Relative Speed
  MAX_PROB: number; // 0-1 - Maximum Probability
}

export interface CollisionEvent {
  id: number;
  sat1NoradId: string;
  sat1Name: string;
  sat1Status: string;
  sat1TleAgeDays: number;
  sat2NoradId: string;
  sat2Name: string;
  sat2Status: string;
  sat2TleAgeDays: number;
  timeOfClosestApproach: Date;
  minRange: number; // km
  dilutionThreshold: number;
  relativeSpeed: number; // km/s
  maxProbability: number; // 0-100%
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const KEEPTRACK_API_URL = 'https://api.keeptrack.space/v2/socrates/latest';

export async function fetchCollisionData(): Promise<CollisionEvent[]> {
  try {
    const response = await fetch(KEEPTRACK_API_URL);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data: KeepTrackCollision[] = await response.json();
    
    return data.map(transformCollision);
  } catch (error) {
    console.error('Failed to fetch collision data:', error);
    throw error;
  }
}

function transformCollision(raw: KeepTrackCollision): CollisionEvent {
  const maxProbPercent = raw.MAX_PROB * 100;
  
  return {
    id: raw.ID,
    sat1NoradId: raw.SAT1,
    sat1Name: raw.SAT1_NAME,
    sat1Status: raw.SAT1_STATUS,
    sat1TleAgeDays: raw.SAT1_AGE_OF_TLE,
    sat2NoradId: raw.SAT2,
    sat2Name: raw.SAT2_NAME,
    sat2Status: raw.SAT2_STATUS,
    sat2TleAgeDays: raw.SAT2_AGE_OF_TLE,
    timeOfClosestApproach: new Date(raw.TOCA),
    minRange: raw.MIN_RNG,
    dilutionThreshold: raw.DILUTION_THRESHOLD,
    relativeSpeed: raw.REL_SPEED,
    maxProbability: maxProbPercent,
    riskLevel: getRiskLevelFromProbability(maxProbPercent, raw.MIN_RNG),
  };
}

function getRiskLevelFromProbability(
  probability: number,
  minRange: number
): 'low' | 'medium' | 'high' | 'critical' {
  // Based on probability and distance
  if (probability >= 10 || minRange < 0.05) return 'critical';
  if (probability >= 5 || minRange < 0.1) return 'high';
  if (probability >= 1 || minRange < 0.5) return 'medium';
  return 'low';
}

export function getRiskColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (riskLevel) {
    case 'critical': return 'hsl(0, 100%, 50%)';
    case 'high': return 'hsl(0, 85%, 60%)';
    case 'medium': return 'hsl(35, 100%, 50%)';
    case 'low': return 'hsl(50, 100%, 50%)';
  }
}

export function formatProbability(probability: number): string {
  if (probability >= 10) return probability.toFixed(1) + '%';
  if (probability >= 1) return probability.toFixed(2) + '%';
  if (probability >= 0.01) return probability.toFixed(3) + '%';
  return '< 0.01%';
}

export function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Passed';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}
