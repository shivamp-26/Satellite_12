import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, Loader2, Zap, Gauge, AlertCircle, Activity, Settings2 } from 'lucide-react';
import { 
  CollisionRisk, 
  getRiskColor, 
  getProbabilityColor, 
  formatProbability,
  CoverageMode,
  COVERAGE_CONFIGS,
  PredictionProgress
} from '@/lib/collision-detector';

interface CollisionPanelProps {
  realTimeCollisions: CollisionRisk[];
  predictedCollisions: CollisionRisk[];
  isLoading: boolean;
  onPredict24Hours: (coverageMode: CoverageMode) => void;
  predictionProgress?: PredictionProgress | null;
  totalSatellites?: number;
}

export default function CollisionPanel({
  realTimeCollisions,
  predictedCollisions,
  isLoading,
  onPredict24Hours,
  predictionProgress,
  totalSatellites = 0,
}: CollisionPanelProps) {
  const [showPredicted, setShowPredicted] = useState(false);
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('standard');
  
  const criticalCount = realTimeCollisions.filter(c => c.riskLevel === 'critical').length;
  const highCount = realTimeCollisions.filter(c => c.riskLevel === 'high').length;
  
  const config = COVERAGE_CONFIGS[coverageMode];
  const effectiveSatellites = coverageMode === 'full' 
    ? totalSatellites 
    : Math.min(config.satelliteLimit, totalSatellites);
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Collision Detection
          </CardTitle>
          <div className="flex gap-1">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge className="bg-warning text-warning-foreground">
                {highCount} High
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-time collisions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              Real-time ({realTimeCollisions.length})
            </p>
          </div>
          
          <ScrollArea className="h-[180px]">
            {realTimeCollisions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No close approaches detected
              </p>
            ) : (
              <div className="space-y-2">
                {realTimeCollisions.slice(0, 10).map((collision) => (
                  <CollisionCard key={collision.id} collision={collision} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* 24-hour prediction */}
        <div className="border-t border-border pt-4">
          {/* Coverage Mode Selector */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Coverage Mode</span>
            </div>
            <Select 
              value={coverageMode} 
              onValueChange={(v) => setCoverageMode(v as CoverageMode)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COVERAGE_CONFIGS).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cfg.label}</span>
                      <span className="text-muted-foreground">- {cfg.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Analyzing {effectiveSatellites.toLocaleString()} of {totalSatellites.toLocaleString()} satellites
            </p>
          </div>
          
          {/* Progress indicator */}
          {isLoading && predictionProgress && (
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">
                  {predictionProgress.phase === 'filtering' && 'Pre-filtering orbits...'}
                  {predictionProgress.phase === 'coarse' && 'Coarse scan (15-min intervals)...'}
                  {predictionProgress.phase === 'refining' && 'Fine refinement...'}
                  {predictionProgress.phase === 'complete' && 'Complete'}
                </span>
                <span className="text-primary font-mono">{predictionProgress.progress}%</span>
              </div>
              <Progress value={predictionProgress.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {predictionProgress.message}
              </p>
            </div>
          )}
          
          <Button
            onClick={() => onPredict24Hours(coverageMode)}
            disabled={isLoading}
            variant="outline"
            className="w-full mb-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Predict Next 24 Hours
              </>
            )}
          </Button>
          
          {predictedCollisions.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPredicted(!showPredicted)}
                className="w-full text-sm text-muted-foreground"
              >
                {showPredicted ? 'Hide' : 'Show'} {predictedCollisions.length} predicted events
              </Button>
              
              {showPredicted && (
                <ScrollArea className="h-[250px] mt-2">
                  <div className="space-y-2">
                    {predictedCollisions.map((collision) => (
                      <CollisionCard key={collision.id} collision={collision} showTime showProbability />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CollisionCard({ 
  collision, 
  showTime = false,
  showProbability = false 
}: { 
  collision: CollisionRisk; 
  showTime?: boolean;
  showProbability?: boolean;
}) {
  const riskColor = getRiskColor(collision.riskLevel);
  const hasProbability = collision.collisionProbability !== undefined;
  const hasVelocity = collision.relativeVelocity !== undefined;
  const hasTleAge = collision.tleAge1 !== undefined && collision.tleAge2 !== undefined;
  
  // TLE age warning threshold (7 days = 168 hours)
  const tleAgeWarning = hasTleAge && (collision.tleAge1! > 168 || collision.tleAge2! > 168);
  
  return (
    <TooltipProvider>
      <div 
        className="p-2 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-colors"
        style={{ borderLeftColor: riskColor, borderLeftWidth: 3 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ color: riskColor, borderColor: riskColor }}
            >
              {collision.riskLevel.toUpperCase()}
            </Badge>
            {tleAgeWarning && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="w-3 h-3 text-warning" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Stale TLE data (&gt;7 days old)</p>
                  <p className="text-xs text-muted-foreground">
                    Sat1: {Math.round(collision.tleAge1! / 24)}d, Sat2: {Math.round(collision.tleAge2! / 24)}d
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span className="text-xs font-mono text-primary">
            {collision.distance.toFixed(2)} km
          </span>
        </div>
        
        {/* Satellite names */}
        <p className="text-xs text-foreground truncate">{collision.sat1.name}</p>
        <p className="text-xs text-muted-foreground truncate">↔ {collision.sat2.name}</p>
        
        {/* Enhanced metrics row */}
        {(hasProbability || hasVelocity) && (
          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-border/50">
            {hasProbability && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" style={{ color: getProbabilityColor(collision.collisionProbability!) }} />
                    <span 
                      className="text-xs font-mono"
                      style={{ color: getProbabilityColor(collision.collisionProbability!) }}
                    >
                      Pc: {formatProbability(collision.collisionProbability!)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">Collision Probability</p>
                  <p className="text-xs text-muted-foreground">
                    Based on miss distance and position uncertainty
                  </p>
                  {collision.positionUncertainty1 && (
                    <p className="text-xs text-muted-foreground">
                      σ₁: {collision.positionUncertainty1}km, σ₂: {collision.positionUncertainty2}km
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasVelocity && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {collision.relativeVelocity!.toFixed(2)} km/s
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">Relative Velocity at TCA</p>
                  <p className="text-xs text-muted-foreground">
                    Impact energy increases with velocity²
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        
        {/* Time of closest approach */}
        {showTime && (
          <p className="text-xs text-muted-foreground mt-1">
            TCA: {collision.timeOfClosestApproach.toLocaleString()}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}