// Parser for satellite database with country, launch date, and other metadata

export interface SatelliteMetadata {
  name: string;
  officialName: string;
  countryRegistry: string;
  countryOperator: string;
  operator: string;
  users: string;
  purpose: string;
  detailedPurpose: string;
  orbitClass: string;
  orbitType: string;
  perigee: number;
  apogee: number;
  inclination: number;
  period: number;
  launchMass: number;
  launchDate: string;
  launchSite: string;
  launchVehicle: string;
  cosparNumber: string;
  noradNumber: string;
}

let metadataCache: Map<string, SatelliteMetadata> | null = null;

export async function loadSatelliteDatabase(): Promise<Map<string, SatelliteMetadata>> {
  if (metadataCache) return metadataCache;
  
  try {
    const response = await fetch('/satellite-database.txt');
    const text = await response.text();
    const lines = text.split('\n');
    
    metadataCache = new Map();
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split('\t');
      if (columns.length < 27) continue;
      
      const noradNumber = columns[26]?.trim();
      if (!noradNumber || noradNumber === 'NORAD Number') continue;
      
      const metadata: SatelliteMetadata = {
        name: columns[0]?.replace(/"/g, '').trim() || '',
        officialName: columns[1]?.trim() || '',
        countryRegistry: columns[2]?.trim() || '',
        countryOperator: columns[3]?.trim() || '',
        operator: columns[4]?.trim() || '',
        users: columns[5]?.trim() || '',
        purpose: columns[6]?.trim() || '',
        detailedPurpose: columns[7]?.trim() || '',
        orbitClass: columns[8]?.trim() || '',
        orbitType: columns[9]?.trim() || '',
        perigee: parseFloat(columns[11]) || 0,
        apogee: parseFloat(columns[12]) || 0,
        inclination: parseFloat(columns[14]) || 0,
        period: parseFloat(columns[15]) || 0,
        launchMass: parseFloat(columns[16]) || 0,
        launchDate: columns[19]?.trim() || '',
        launchSite: columns[23]?.trim() || '',
        launchVehicle: columns[24]?.trim() || '',
        cosparNumber: columns[25]?.trim() || '',
        noradNumber: noradNumber,
      };
      
      metadataCache.set(noradNumber, metadata);
    }
    
    console.log(`Loaded ${metadataCache.size} satellite metadata entries`);
    return metadataCache;
  } catch (error) {
    console.error('Failed to load satellite database:', error);
    return new Map();
  }
}

export function getSatelliteMetadata(noradId: string): SatelliteMetadata | undefined {
  return metadataCache?.get(noradId);
}

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Russia': '🇷🇺',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'India': '🇮🇳',
  'ESA': '🇪🇺',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'UK': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Brazil': '🇧🇷',
  'South Korea': '🇰🇷',
  'Israel': '🇮🇱',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Australia': '🇦🇺',
  'Argentina': '🇦🇷',
  'Mexico': '🇲🇽',
  'Indonesia': '🇮🇩',
  'Luxembourg': '🇱🇺',
  'Netherlands': '🇳🇱',
  'Multinational': '🌍',
};

export function getCountryFlag(country: string): string {
  if (!country) return '🛰️';
  
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (country.toLowerCase().includes(key.toLowerCase())) {
      return flag;
    }
  }
  return '🌍';
}

export function formatLaunchDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  
  // Handle various date formats
  const cleaned = dateStr.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  return cleaned;
}
