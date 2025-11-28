import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Satellite, Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Earth3DEnhanced from "@/components/monitoring/Earth3DEnhanced";
import SatellitePanel from "@/components/monitoring/SatellitePanel";
import SettingsPanel from "@/components/monitoring/SettingsPanel";
import CollisionPanel from "@/components/monitoring/CollisionPanelNew";
import OrbitFilter from "@/components/monitoring/OrbitFilter";
import StatsOverlay from "@/components/monitoring/StatsOverlay";
import SatelliteSearch from "@/components/monitoring/SatelliteSearch";
import TimeControl from "@/components/monitoring/TimeControl";
import {
  SatelliteData,
  initializeSatellite,
  propagateSatellite,
} from "@/lib/satellite-utils";
import { parseTLEFile, classifyOrbit } from "@/lib/tle-parser";
import { 
  CollisionRisk, 
  detectRealTimeCollisions, 
} from "@/lib/collision-detector";
import { loadSatelliteDatabase } from "@/lib/satellite-database";

export default function Monitoring() {
  const [allSatellites, setAllSatellites] = useState<SatelliteData[]>([]);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);
  const [realTimeCollisions, setRealTimeCollisions] = useState<CollisionRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Time control state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeSpeed, setTimeSpeed] = useState(60); // 60x real time by default
  const lastUpdateRef = useRef(Date.now());
  
  // Settings
  const [showOrbits, setShowOrbits] = useState(true);
  const [showDebris, setShowDebris] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showTerminator, setShowTerminator] = useState(true);
  const [orbitFilters, setOrbitFilters] = useState<('LEO' | 'MEO' | 'GEO' | 'HEO')[]>(['LEO', 'MEO', 'GEO', 'HEO']);
  
  // Right sidebar visibility
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Load TLE data and satellite database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load satellite metadata database
        const metadataDb = await loadSatelliteDatabase();
        
        const parsed = await parseTLEFile('/satellite_data.txt');
        
        // Convert to SatelliteData format with metadata
        const satData: SatelliteData[] = parsed.slice(0, 2000).map((p) => {
          const metadata = metadataDb.get(p.noradId);
          
          const sat: SatelliteData = {
            id: p.id,
            name: p.name,
            noradId: p.noradId,
            tle1: p.tle1,
            tle2: p.tle2,
            orbitType: p.orbitType,
            inclination: p.inclination,
            // Add metadata from database
            country: metadata?.countryOperator || metadata?.countryRegistry || undefined,
            launchDate: metadata?.launchDate || undefined,
            purpose: metadata?.purpose || undefined,
            operator: metadata?.operator || undefined,
            launchSite: metadata?.launchSite || undefined,
            launchVehicle: metadata?.launchVehicle || undefined,
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
        console.error('Failed to load data:', error);
      }
      setIsLoading(false);
    };
    
    loadData();
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

  // Update time based on play state and speed
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      
      setCurrentTime(prev => new Date(prev.getTime() + delta * timeSpeed));
    }, 100); // Update every 100ms for smooth animation
    
    return () => clearInterval(interval);
  }, [isPlaying, timeSpeed]);

  // Propagate positions based on current simulation time
  const updatePositions = useCallback(() => {
    setSatellites((sats) => sats.map((sat) => propagateSatellite(sat, currentTime)));
  }, [currentTime]);

  // Update positions when time changes significantly
  useEffect(() => {
    if (allSatellites.length === 0) return;
    updatePositions();
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

  // Update selected satellite when positions update
  useEffect(() => {
    if (selectedSatellite) {
      const updated = satellites.find((s) => s.id === selectedSatellite.id);
      if (updated) {
        setSelectedSatellite(updated);
      }
    }
  }, [satellites, selectedSatellite?.id]);

  const handleTimeChange = (newTime: Date) => {
    setCurrentTime(newTime);
    lastUpdateRef.current = Date.now();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    lastUpdateRef.current = Date.now();
  };

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
          
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading TLE data...</span>
              </div>
            )}
            
            <Button
              variant={showRightSidebar ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="gap-2"
            >
              {showRightSidebar ? (
                <>
                  <PanelRightClose className="w-4 h-4" />
                  Hide Panel
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4" />
                  Collision Alerts
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Resizable Panels */}
      <main className="pt-16 h-screen">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)]">
          {/* Left Sidebar - Resizable */}
          <ResizablePanel 
            defaultSize={22} 
            minSize={15} 
            maxSize={35}
            className="bg-card/30"
          >
            <div className="h-full overflow-y-auto p-4 space-y-4 border-r border-border">
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
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

          {/* 3D Globe - Center Panel */}
          <ResizablePanel defaultSize={showRightSidebar ? 56 : 78} minSize={40}>
            <div className="h-full relative">
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
                    currentTime={currentTime}
                    showTrails={showTrails}
                    showTerminator={showTerminator}
                  />
                  
                  <StatsOverlay
                    totalSatellites={allSatellites.length}
                    visibleSatellites={filteredSatellites.length}
                    collisions={realTimeCollisions}
                    isLive={isPlaying}
                  />
                  
                  {/* Time Control Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto">
                    <TimeControl
                      currentTime={currentTime}
                      onTimeChange={handleTimeChange}
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
                      speed={timeSpeed}
                      onSpeedChange={setTimeSpeed}
                    />
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>

          {/* Right Sidebar - Toggleable & Resizable */}
          {showRightSidebar && (
            <>
              <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />
              <ResizablePanel 
                defaultSize={22} 
                minSize={15} 
                maxSize={35}
                className="bg-card/30"
              >
                <div className="h-full overflow-y-auto p-4 space-y-4 border-l border-border animate-in slide-in-from-right duration-300">
                  <SettingsPanel
                    showOrbits={showOrbits}
                    setShowOrbits={setShowOrbits}
                    showDebris={showDebris}
                    setShowDebris={setShowDebris}
                    showTrails={showTrails}
                    setShowTrails={setShowTrails}
                    showTerminator={showTerminator}
                    setShowTerminator={setShowTerminator}
                  />
                  
                  <CollisionPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
