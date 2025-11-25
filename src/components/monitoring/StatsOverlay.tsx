import { Satellite, AlertTriangle, Activity } from 'lucide-react';
import { CollisionRisk } from '@/lib/collision-detector';

interface StatsOverlayProps {
  totalSatellites: number;
  visibleSatellites: number;
  collisions: CollisionRisk[];
  isLive: boolean;
}

export default function StatsOverlay({ 
  totalSatellites, 
  visibleSatellites, 
  collisions,
  isLive,
}: StatsOverlayProps) {
  const criticalCount = collisions.filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high').length;
  
  return (
    <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[300px]">
      <div className="px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center gap-2">
        <Satellite className="w-4 h-4 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Satellites</p>
          <p className="text-lg font-bold text-primary leading-none">
            {visibleSatellites.toLocaleString()}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              / {totalSatellites.toLocaleString()}
            </span>
          </p>
        </div>
      </div>
      
      {criticalCount > 0 && (
        <div className="px-3 py-2 rounded-lg bg-destructive/20 backdrop-blur-sm border border-destructive/50 flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <div>
            <p className="text-xs text-destructive/80">Collision Risk</p>
            <p className="text-lg font-bold text-destructive leading-none">
              {criticalCount}
            </p>
          </div>
        </div>
      )}
      
      {isLive && (
        <div className="px-3 py-2 rounded-lg bg-success/10 backdrop-blur-sm border border-success/30 flex items-center gap-2">
          <Activity className="w-4 h-4 text-success animate-pulse" />
          <span className="text-sm text-success font-medium">Live</span>
        </div>
      )}
    </div>
  );
}
