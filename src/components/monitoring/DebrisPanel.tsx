import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DebrisPanelProps {
  debrisCount: number;
  isVisible: boolean;
}

export default function DebrisPanel({ debrisCount, isVisible }: DebrisPanelProps) {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Space Debris</h3>
            <p className="text-xs text-muted-foreground">
              {isVisible ? 'Visible on map' : 'Hidden'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-destructive">{debrisCount}</p>
          <p className="text-xs text-muted-foreground">objects tracked</p>
        </div>
      </div>
    </Card>
  );
}
