import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Satellite, Loader2 } from "lucide-react";
import Earth3DEnhanced from "@/components/monitoring/Earth3DEnhanced";
import SatellitePanel from "@/components/monitoring/SatellitePanel";
import SettingsPanel from "@/components/monitoring/SettingsPanel";
import CollisionPanel from "@/components/monitoring/CollisionPanel";
import OrbitFilter from "@/components/monitoring/OrbitFilter";
import StatsOverlay from "@/components/monitoring/StatsOverlay";
import SatelliteSearch from "@/components/monitoring/SatelliteSearch";
import {
  SatelliteData,
  initializeSatellite,
  propagateSatellite,
} from "@/lib/satellite-utils";
import { parseTLEFile, classifyOrbit } from "@/lib/tle-parser";
import { 
  CollisionRisk, 
  detectRealTimeCollisions, 
  predictCollisions24Hours 
} from "@/lib/collision-detector";

export default function Monitoring() {
  const [allSatellites, setAllSatellites] = useState<SatelliteData[]>([]);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);
  const [realTimeCollisions, setRealTimeCollisions] = useState<CollisionRisk[]>([]);
  const [predictedCollisions, setPredictedCollisions] = useState<CollisionRisk[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings
  const [showOrbits, setShowOrbits] = useState(true);
  const [showDebris, setShowDebris] = useState(false);
  const [satelliteStyle, setSatelliteStyle] = useState<'dot' | 'sphere'>('sphere');
  const [orbitFilters, setOrbitFilters] = useState<('LEO' | 'MEO' | 'GEO' | 'HEO')[]>(['LEO', 'MEO', 'GEO', 'HEO']);

  // Load TLE data
  useEffect(() => {
    const loadSatellites = async () => {
      setIsLoading(true);
      try {
        const parsed = await parseTLEFile('/satellite_data.txt');
        
        // Convert to SatelliteData format and initialize (limit to 500 for performance)
        const satData: SatelliteData[] = parsed.slice(0, 500).map((p) => {
          const sat: SatelliteData = {
            id: p.id,
            name: p.name,
            noradId: p.noradId,
            tle1: p.tle1,
            tle2: p.tle2,
            orbitType: p.orbitType,
            inclination: p.inclination,
          };
          return initializeSatellite(sat);
        });
        
        // Calculate orbit type for each satellite
        satData.forEach((sat) => {
          if (sat.satrec) {
            const meanMotion = sat.satrec.no * 1440 / (2 * Math.PI);
            const periodMinutes = 1440 / meanMotion;
            const eccentricity = sat.satrec.ecco;
            const semiMajorAxis = Math.pow((86400 / (meanMotion * 2 * Math.PI)), 2/3) * 6.6228;
            sat.orbitType = classifyOrbit(semiMajorAxis, eccentricity, periodMinutes);
          }
        });
        
        setAllSatellites(satData);
        setSatellites(satData);
      } catch (error) {
        console.error('Failed to load TLE data:', error);
      }
      setIsLoading(false);
    };
    
    loadSatellites();
  }, []);

  // Filter satellites by orbit type
  const filteredSatellites = useMemo(() => {
    return satellites.filter(sat => 
      sat.orbitType && orbitFilters.includes(sat.orbitType)
    );
  }, [satellites, orbitFilters]);

  // Count satellites by orbit type
  const orbitCounts = useMemo(() => {
    return {
      LEO: allSatellites.filter(s => s.orbitType === 'LEO').length,
      MEO: allSatellites.filter(s => s.orbitType === 'MEO').length,
      GEO: allSatellites.filter(s => s.orbitType === 'GEO').length,
      HEO: allSatellites.filter(s => s.orbitType === 'HEO').length,
    };
  }, [allSatellites]);

  // Propagate positions
  const updatePositions = useCallback(() => {
    const now = new Date();
    setSatellites((sats) => sats.map((sat) => propagateSatellite(sat, now)));
  }, []);

  // Update positions periodically
  useEffect(() => {
    if (allSatellites.length === 0) return;
    
    updatePositions();
    const interval = setInterval(updatePositions, 1000);
    return () => clearInterval(interval);
  }, [updatePositions, allSatellites.length]);

  // Detect real-time collisions
  useEffect(() => {
    if (filteredSatellites.length === 0) return;
    
    const detectCollisions = () => {
      const collisions = detectRealTimeCollisions(filteredSatellites, 50);
      setRealTimeCollisions(collisions);
    };
    
    detectCollisions();
    const interval = setInterval(detectCollisions, 5000);
    return () => clearInterval(interval);
  }, [filteredSatellites]);

  // Handle 24-hour prediction
  const handlePredict24Hours = useCallback(async () => {
    setIsPredicting(true);
    
    // Run in chunks to not block UI
    setTimeout(() => {
      const predictions = predictCollisions24Hours(filteredSatellites.slice(0, 200), 50);
      setPredictedCollisions(predictions);
      setIsPredicting(false);
    }, 100);
  }, [filteredSatellites]);

  // Update selected satellite when positions update
  useEffect(() => {
    if (selectedSatellite) {
      const updated = satellites.find((s) => s.id === selectedSatellite.id);
      if (updated) {
        setSelectedSatellite(updated);
      }
    }
  }, [satellites, selectedSatellite?.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Satellite Monitoring</h1>
            </div>
          </div>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading TLE data...</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 h-screen flex">
        {/* Left Sidebar */}
        <aside className="w-80 h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-4 border-r border-border bg-card/30">
          <SatelliteSearch
            satellites={filteredSatellites}
            onSelect={setSelectedSatellite}
            selectedId={selectedSatellite?.id}
          />
          
          <OrbitFilter
            filters={orbitFilters}
            onChange={setOrbitFilters}
            counts={orbitCounts}
          />
          
          <SatellitePanel satellite={selectedSatellite} />
        </aside>

        {/* 3D Globe */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading satellite data...</p>
              </div>
            </div>
          ) : (
            <>
              <Earth3DEnhanced
                satellites={filteredSatellites}
                selectedSatellite={selectedSatellite}
                onSelectSatellite={setSelectedSatellite}
                showOrbits={showOrbits}
                collisions={realTimeCollisions}
                orbitFilters={orbitFilters}
              />
              
              <StatsOverlay
                totalSatellites={allSatellites.length}
                visibleSatellites={filteredSatellites.length}
                collisions={realTimeCollisions}
                isLive={true}
              />
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="w-80 h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-4 border-l border-border bg-card/30">
          <SettingsPanel
            showOrbits={showOrbits}
            setShowOrbits={setShowOrbits}
            showDebris={showDebris}
            setShowDebris={setShowDebris}
            satelliteStyle={satelliteStyle}
            setSatelliteStyle={setSatelliteStyle}
          />
          
          <CollisionPanel
            realTimeCollisions={realTimeCollisions}
            predictedCollisions={predictedCollisions}
            isLoading={isPredicting}
            onPredict24Hours={handlePredict24Hours}
          />
        </aside>
      </main>
    </div>
  );
}
