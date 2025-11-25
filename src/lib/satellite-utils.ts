import * as satellite from 'satellite.js';

export interface SatelliteData {
  id: string;
  name: string;
  noradId: string;
  tle1: string;
  tle2: string;
  position?: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  altitude?: number;
  latitude?: number;
  longitude?: number;
  inclination?: number;
  period?: number;
  apogee?: number;
  perigee?: number;
  country?: string;
  launchDate?: string;
  satrec?: satellite.SatRec;
  orbitType?: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  // Extended metadata from database
  purpose?: string;
  operator?: string;
  launchSite?: string;
  launchVehicle?: string;
}

export interface DebrisData {
  id: string;
  name: string;
  tle1: string;
  tle2: string;
  position?: { x: number; y: number; z: number };
  satrec?: satellite.SatRec;
}

export interface ConjunctionEvent {
  id: string;
  satellite1: string;
  satellite2: string;
  minDistance: number;
  timeOfClosestApproach: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

// Sample TLE data for demonstration
export const sampleSatellites: SatelliteData[] = [
  {
    id: 'iss',
    name: 'ISS (ZARYA)',
    noradId: '25544',
    tle1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9025',
    tle2: '2 25544  51.6400 208.9163 0006703  35.7796  74.1376 15.48919755421234',
    country: 'International',
    launchDate: '1998-11-20',
  },
  {
    id: 'hubble',
    name: 'HST (Hubble)',
    noradId: '20580',
    tle1: '1 20580U 90037B   24001.50000000  .00000680  00000-0  30350-4 0  9995',
    tle2: '2 20580  28.4710 176.4553 0002737  66.5493 293.5837 15.09299890523189',
    country: 'USA',
    launchDate: '1990-04-24',
  },
  {
    id: 'terra',
    name: 'TERRA',
    noradId: '25994',
    tle1: '1 25994U 99068A   24001.50000000  .00000130  00000-0  37826-4 0  9993',
    tle2: '2 25994  98.2104 316.8456 0001234  82.2756 277.8612 14.57107350287654',
    country: 'USA',
    launchDate: '1999-12-18',
  },
  {
    id: 'gps-15',
    name: 'GPS BIIR-15',
    noradId: '32711',
    tle1: '1 32711U 08012A   24001.50000000 -.00000030  00000-0  00000+0 0  9992',
    tle2: '2 32711  55.4148 119.4376 0125634 246.8765 111.9843  2.00556234117654',
    country: 'USA',
    launchDate: '2008-03-15',
  },
  {
    id: 'starlink-1007',
    name: 'STARLINK-1007',
    noradId: '44713',
    tle1: '1 44713U 19074A   24001.50000000  .00002380  00000-0  16510-3 0  9991',
    tle2: '2 44713  53.0536 167.9856 0001234 267.8345  92.2543 15.06391234234567',
    country: 'USA',
    launchDate: '2019-11-11',
  },
  {
    id: 'sentinel-2a',
    name: 'SENTINEL-2A',
    noradId: '40697',
    tle1: '1 40697U 15028A   24001.50000000  .00000020  00000-0  16789-4 0  9994',
    tle2: '2 40697  98.5680 279.7890 0001234  87.6543 272.4789 14.30818765198765',
    country: 'ESA',
    launchDate: '2015-06-23',
  },
];

// Sample debris data
export const sampleDebris: DebrisData[] = Array.from({ length: 300 }, (_, i) => ({
  id: `debris-${i}`,
  name: `DEBRIS ${i + 1}`,
  tle1: `1 ${40000 + i}U 20001A   24001.50000000  .00000${100 + (i % 900)}  00000-0  ${(i % 100).toString().padStart(5, '0')}-4 0  999${i % 10}`,
  tle2: `2 ${40000 + i}  ${(30 + (i * 2) % 120).toFixed(4)} ${(i * 3.7 % 360).toFixed(4)} 000${(i % 9000).toString().padStart(4, '0')} ${(i * 1.2 % 360).toFixed(4)} ${(i * 2.3 % 360).toFixed(4)} ${(14 + (i % 3) * 0.5).toFixed(8)}${(100000 + i).toString().slice(-5)}`,
}));

const EARTH_RADIUS_KM = 6371;
const SCALE_FACTOR = 1 / 1000; // Scale down for 3D visualization

export function initializeSatellite(sat: SatelliteData): SatelliteData {
  try {
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
    return { ...sat, satrec };
  } catch {
    return sat;
  }
}

export function initializeDebris(debris: DebrisData): DebrisData {
  try {
    const satrec = satellite.twoline2satrec(debris.tle1, debris.tle2);
    return { ...debris, satrec };
  } catch {
    return debris;
  }
}

export function propagateSatellite(sat: SatelliteData, date: Date): SatelliteData {
  if (!sat.satrec) return sat;
  
  try {
    const positionAndVelocity = satellite.propagate(sat.satrec, date);
    
    if (typeof positionAndVelocity.position === 'boolean') return sat;
    
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
    
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
    
    const altitude = positionGd.height;
    const latitude = satellite.degreesLat(positionGd.latitude);
    const longitude = satellite.degreesLong(positionGd.longitude);
    
    // Convert to 3D coordinates (scaled)
    const x = positionEci.x * SCALE_FACTOR;
    const y = positionEci.z * SCALE_FACTOR; // Swap Y and Z for Three.js
    const z = -positionEci.y * SCALE_FACTOR;
    
    // Calculate orbital parameters
    const meanMotion = sat.satrec.no * 1440 / (2 * Math.PI); // rev/day
    const period = 1440 / meanMotion; // minutes
    const inclination = satellite.degreesLat(sat.satrec.inclo);
    const eccentricity = sat.satrec.ecco;
    const semiMajorAxis = Math.pow((86400 / (meanMotion * 2 * Math.PI)), 2/3) * 6.6228;
    const apogee = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS_KM;
    const perigee = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS_KM;
    
    return {
      ...sat,
      position: { x, y, z },
      velocity: { 
        x: velocityEci.x, 
        y: velocityEci.z, 
        z: -velocityEci.y 
      },
      altitude,
      latitude,
      longitude,
      inclination,
      period,
      apogee: Math.max(0, apogee),
      perigee: Math.max(0, perigee),
    };
  } catch {
    return sat;
  }
}

export function propagateDebris(debris: DebrisData, date: Date): DebrisData {
  if (!debris.satrec) return debris;
  
  try {
    const positionAndVelocity = satellite.propagate(debris.satrec, date);
    
    if (typeof positionAndVelocity.position === 'boolean') return debris;
    
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    
    const x = positionEci.x * SCALE_FACTOR;
    const y = positionEci.z * SCALE_FACTOR;
    const z = -positionEci.y * SCALE_FACTOR;
    
    return {
      ...debris,
      position: { x, y, z },
    };
  } catch {
    return debris;
  }
}

export function calculateOrbitPath(sat: SatelliteData, date: Date, points: number = 100): { x: number; y: number; z: number }[] {
  if (!sat.satrec || !sat.period) return [];
  
  const path: { x: number; y: number; z: number }[] = [];
  const periodMs = sat.period * 60 * 1000;
  
  for (let i = 0; i < points; i++) {
    const t = new Date(date.getTime() + (i / points) * periodMs);
    const propagated = propagateSatellite(sat, t);
    if (propagated.position) {
      path.push(propagated.position);
    }
  }
  
  return path;
}

export function detectConjunctions(
  satellites: SatelliteData[], 
  debris: DebrisData[], 
  date: Date,
  hoursAhead: number = 24
): ConjunctionEvent[] {
  const events: ConjunctionEvent[] = [];
  const thresholdKm = 10; // 10km threshold for detection
  
  // Check satellite vs satellite
  for (let i = 0; i < satellites.length; i++) {
    for (let j = i + 1; j < satellites.length; j++) {
      const conjunction = findClosestApproach(
        satellites[i], 
        satellites[j], 
        date, 
        hoursAhead
      );
      if (conjunction && conjunction.minDistance < thresholdKm) {
        events.push({
          id: `${satellites[i].id}-${satellites[j].id}`,
          satellite1: satellites[i].name,
          satellite2: satellites[j].name,
          ...conjunction,
        });
      }
    }
  }
  
  // Check satellite vs debris (sample check for performance)
  const debrisSample = debris.slice(0, 50);
  for (const sat of satellites) {
    for (const deb of debrisSample) {
      const satWithSatrec = { ...sat, satrec: sat.satrec } as SatelliteData;
      const debWithSatrec = { 
        ...deb, 
        satrec: deb.satrec,
        noradId: deb.id,
        country: 'Unknown',
        launchDate: 'Unknown',
      } as SatelliteData;
      
      const conjunction = findClosestApproach(
        satWithSatrec, 
        debWithSatrec, 
        date, 
        hoursAhead
      );
      if (conjunction && conjunction.minDistance < thresholdKm * 2) {
        events.push({
          id: `${sat.id}-${deb.id}`,
          satellite1: sat.name,
          satellite2: deb.name,
          ...conjunction,
        });
      }
    }
  }
  
  return events.sort((a, b) => a.minDistance - b.minDistance).slice(0, 10);
}

function findClosestApproach(
  sat1: SatelliteData, 
  sat2: SatelliteData, 
  startDate: Date, 
  hoursAhead: number
): Omit<ConjunctionEvent, 'id' | 'satellite1' | 'satellite2'> | null {
  if (!sat1.satrec || !sat2.satrec) return null;
  
  let minDistance = Infinity;
  let timeOfClosest = startDate;
  
  const steps = 48; // Check every 30 minutes
  const stepMs = (hoursAhead * 60 * 60 * 1000) / steps;
  
  for (let i = 0; i < steps; i++) {
    const t = new Date(startDate.getTime() + i * stepMs);
    const pos1 = propagateSatellite(sat1, t);
    const pos2 = propagateSatellite(sat2, t);
    
    if (pos1.position && pos2.position) {
      const distance = Math.sqrt(
        Math.pow((pos1.position.x - pos2.position.x) / SCALE_FACTOR, 2) +
        Math.pow((pos1.position.y - pos2.position.y) / SCALE_FACTOR, 2) +
        Math.pow((pos1.position.z - pos2.position.z) / SCALE_FACTOR, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        timeOfClosest = t;
      }
    }
  }
  
  const riskLevel: 'low' | 'medium' | 'high' = 
    minDistance < 1 ? 'high' : 
    minDistance < 5 ? 'medium' : 'low';
  
  return {
    minDistance: Math.round(minDistance * 100) / 100,
    timeOfClosestApproach: timeOfClosest,
    riskLevel,
  };
}
