import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Ruler } from "lucide-react";
import { ConjunctionEvent } from "@/lib/satellite-utils";

interface ConjunctionAlertProps {
  events: ConjunctionEvent[];
}

export default function ConjunctionAlert({ events }: ConjunctionAlertProps) {
  if (events.length === 0) {
    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-success" />
          <h3 className="text-sm font-bold">Conjunction Detection</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No close approaches detected in the next 24 hours.
        </p>
      </Card>
    );
  }

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-bold">Closest Approaches</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {events.length} detected
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {events.map((event) => (
          <div 
            key={event.id}
            className="p-3 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{event.satellite1}</p>
                <p className="text-xs text-muted-foreground">vs</p>
                <p className="text-xs font-semibold truncate">{event.satellite2}</p>
              </div>
              <Badge variant="outline" className={getRiskColor(event.riskLevel)}>
                {event.riskLevel.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Ruler className="w-3 h-3" />
                <span>{event.minDistance} km</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>in {formatTime(event.timeOfClosestApproach)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
