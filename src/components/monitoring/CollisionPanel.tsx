import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock, Loader2, Zap } from 'lucide-react';
import { CollisionRisk, getRiskColor } from '@/lib/collision-detector';

interface CollisionPanelProps {
  realTimeCollisions: CollisionRisk[];
  predictedCollisions: CollisionRisk[];
  isLoading: boolean;
  onPredict24Hours: () => void;
}

export default function CollisionPanel({
  realTimeCollisions,
  predictedCollisions,
  isLoading,
  onPredict24Hours,
}: CollisionPanelProps) {
  const [showPredicted, setShowPredicted] = useState(false);
  
  const criticalCount = realTimeCollisions.filter(c => c.riskLevel === 'critical').length;
  const highCount = realTimeCollisions.filter(c => c.riskLevel === 'high').length;
  
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
          
          <ScrollArea className="h-[150px]">
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
          <Button
            onClick={onPredict24Hours}
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
                <ScrollArea className="h-[200px] mt-2">
                  <div className="space-y-2">
                    {predictedCollisions.map((collision) => (
                      <CollisionCard key={collision.id} collision={collision} showTime />
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

function CollisionCard({ collision, showTime = false }: { collision: CollisionRisk; showTime?: boolean }) {
  const riskColor = getRiskColor(collision.riskLevel);
  
  return (
    <div 
      className="p-2 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-colors"
      style={{ borderLeftColor: riskColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between mb-1">
        <Badge 
          variant="outline" 
          className="text-xs"
          style={{ color: riskColor, borderColor: riskColor }}
        >
          {collision.riskLevel.toUpperCase()}
        </Badge>
        <span className="text-xs font-mono text-primary">
          {collision.distance.toFixed(2)} km
        </span>
      </div>
      <p className="text-xs text-foreground truncate">{collision.sat1.name}</p>
      <p className="text-xs text-muted-foreground truncate">↔ {collision.sat2.name}</p>
      {showTime && (
        <p className="text-xs text-muted-foreground mt-1">
          TCA: {collision.timeOfClosestApproach.toLocaleString()}
        </p>
      )}
    </div>
  );
}
