import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Orbit, Trash2, Circle } from "lucide-react";

interface SettingsPanelProps {
  showOrbits: boolean;
  setShowOrbits: (value: boolean) => void;
  showDebris: boolean;
  setShowDebris: (value: boolean) => void;
  satelliteStyle: 'dot' | 'sphere';
  setSatelliteStyle: (value: 'dot' | 'sphere') => void;
}

export default function SettingsPanel({
  showOrbits,
  setShowOrbits,
  showDebris,
  setShowDebris,
  satelliteStyle,
  setSatelliteStyle,
}: SettingsPanelProps) {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">Display Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="orbits" className="flex items-center gap-2 text-sm cursor-pointer">
            <Orbit className="w-4 h-4 text-muted-foreground" />
            Show Orbit Lines
          </Label>
          <Switch
            id="orbits"
            checked={showOrbits}
            onCheckedChange={setShowOrbits}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="debris" className="flex items-center gap-2 text-sm cursor-pointer">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
            Show Debris
          </Label>
          <Switch
            id="debris"
            checked={showDebris}
            onCheckedChange={setShowDebris}
          />
        </div>
        
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Satellite Style</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSatelliteStyle('dot')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
                satelliteStyle === 'dot' 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <Circle className="w-3 h-3" fill="currentColor" />
              <span className="text-xs">Dot</span>
            </button>
            <button
              onClick={() => setSatelliteStyle('sphere')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
                satelliteStyle === 'sphere' 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span className="text-xs">Sphere</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
