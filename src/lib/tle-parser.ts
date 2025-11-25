import * as satellite from 'satellite.js';

export interface ParsedSatellite {
  id: string;
  name: string;
  noradId: string;
  tle1: string;
  tle2: string;
  inclination: number;
  orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO';
}

// Classify orbit type based on altitude and eccentricity
export function classifyOrbit(
  semiMajorAxis: number,
  eccentricity: number,
  periodMinutes: number
): 'LEO' | 'MEO' | 'GEO' | 'HEO' {
  const EARTH_RADIUS_KM = 6371;
  const apogee = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS_KM;
  const perigee = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS_KM;
  
  // GEO: period ~1440 minutes (24 hours), low eccentricity
  if (periodMinutes > 1400 && periodMinutes < 1500 && eccentricity < 0.1) {
    return 'GEO';
  }
  
  // HEO: high eccentricity (Molniya, Tundra orbits)
  if (eccentricity > 0.25 && apogee > 20000) {
    return 'HEO';
  }
  
  // LEO: altitude < 2000 km
  if (apogee < 2000) {
    return 'LEO';
  }
  
  // MEO: between LEO and GEO
  return 'MEO';
}

export function getOrbitColor(orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO'): string {
  switch (orbitType) {
    case 'LEO': return '#00ff88'; // Green
    case 'MEO': return '#ffdd00'; // Yellow
    case 'GEO': return '#ff4444'; // Red
    case 'HEO': return '#4488ff'; // Blue
  }
}

export async function parseTLEFile(url: string): Promise<ParsedSatellite[]> {
  const response = await fetch(url);
  const text = await response.text();
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const satellites: ParsedSatellite[] = [];
  
  let i = 0;
  while (i < lines.length - 2) {
    // TLE format: Name line, then Line 1, then Line 2
    const nameLine = lines[i];
    const tle1 = lines[i + 1];
    const tle2 = lines[i + 2];
    
    // Validate TLE format
    if (tle1.startsWith('1 ') && tle2.startsWith('2 ')) {
      try {
        const satrec = satellite.twoline2satrec(tle1, tle2);
        
        // Extract orbital parameters
        const meanMotion = satrec.no * 1440 / (2 * Math.PI); // rev/day
        const periodMinutes = 1440 / meanMotion;
        const eccentricity = satrec.ecco;
        const inclination = satellite.degreesLat(satrec.inclo);
        
        // Calculate semi-major axis
        const semiMajorAxis = Math.pow((86400 / (meanMotion * 2 * Math.PI)), 2/3) * 6.6228;
        
        // Extract NORAD ID from TLE
        const noradId = tle1.substring(2, 7).trim();
        
        const orbitType = classifyOrbit(semiMajorAxis, eccentricity, periodMinutes);
        
        satellites.push({
          id: `sat-${noradId}`,
          name: nameLine.trim(),
          noradId,
          tle1,
          tle2,
          inclination,
          orbitType,
        });
      } catch (error) {
        // Skip invalid TLEs
      }
      i += 3;
    } else {
      i += 1;
    }
  }
  
  return satellites;
}

export function filterSatellitesByOrbit(
  satellites: ParsedSatellite[],
  types: ('LEO' | 'MEO' | 'GEO' | 'HEO')[]
): ParsedSatellite[] {
  return satellites.filter(sat => types.includes(sat.orbitType));
}
