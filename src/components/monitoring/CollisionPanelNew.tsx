import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, RefreshCw, Loader2, Activity, Clock, AlertCircle, Gauge, ExternalLink } from 'lucide-react';
import { 
  CollisionEvent, 
  fetchCollisionData, 
  getRiskColor, 
  formatProbability, 
  formatTimeUntil 
} from '@/lib/keeptrack-api';

export default function CollisionPanelNew() {
  const [collisions, setCollisions] = useState<CollisionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCollisionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCollisionData();
      setCollisions(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load collision data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollisionData();
    // Refresh every 5 minutes
    const interval = setInterval(loadCollisionData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = collisions.filter(c => c.riskLevel === 'critical').length;
  const highCount = collisions.filter(c => c.riskLevel === 'high').length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Collision Alerts
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadCollisionData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge className="bg-orange-500/80 text-white">
                {highCount} High
              </Badge>
            )}
          </div>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && collisions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={loadCollisionData} className="mt-2">
              Retry
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {collisions.map((collision) => (
                <CollisionCard key={collision.id} collision={collision} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function CollisionCard({ collision }: { collision: CollisionEvent }) {
  const riskColor = getRiskColor(collision.riskLevel);
  const tleAgeWarning = collision.sat1TleAgeDays > 7 || collision.sat2TleAgeDays > 7;

  return (
    <TooltipProvider>
      <div
        className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-colors"
        style={{ borderLeftColor: riskColor, borderLeftWidth: 3 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-semibold"
              style={{ color: riskColor, borderColor: riskColor }}
            >
              {collision.riskLevel.toUpperCase()}
            </Badge>
            {tleAgeWarning && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Stale TLE data (&gt;7 days old)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTimeUntil(collision.timeOfClosestApproach)}
          </div>
        </div>

        {/* Satellite names */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
              {collision.sat1Name}
            </p>
            <StatusBadge status={collision.sat1Status} />
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs">↔</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
              {collision.sat2Name}
            </p>
            <StatusBadge status={collision.sat2Status} />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <span className="text-xs font-mono text-primary">
                {collision.minRange.toFixed(3)} km
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Minimum Range at TCA</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 justify-end">
              <Gauge className="w-3 h-3" style={{ color: riskColor }} />
              <span
                className="text-xs font-mono"
                style={{ color: riskColor }}
              >
                {formatProbability(collision.maxProbability)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Maximum Collision Probability</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">
                {collision.relativeSpeed.toFixed(2)} km/s
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Relative Velocity at TCA</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1 justify-end">
            <span className="text-xs text-muted-foreground">
              ID: {collision.sat1NoradId} / {collision.sat2NoradId}
            </span>
          </div>
        </div>

        {/* TCA Time */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            TCA: {collision.timeOfClosestApproach.toLocaleString()}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOperational = status === 'Operational';
  const isPartial = status === 'Partially Operational';

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded ${
        isOperational
          ? 'bg-green-500/20 text-green-400'
          : isPartial
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {isOperational ? 'Active' : isPartial ? 'Partial' : 'Inactive'}
    </span>
  );
}
