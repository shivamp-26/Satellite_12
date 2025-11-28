import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Orbit, Trash2, Route, Sun } from "lucide-react";

interface SettingsPanelProps {
  showOrbits: boolean;
  setShowOrbits: (value: boolean) => void;
  showDebris: boolean;
  setShowDebris: (value: boolean) => void;
  showTrails: boolean;
  setShowTrails: (value: boolean) => void;
  showTerminator: boolean;
  setShowTerminator: (value: boolean) => void;
}

export default function SettingsPanel({
  showOrbits,
  setShowOrbits,
  showDebris,
  setShowDebris,
  showTrails,
  setShowTrails,
  showTerminator,
  setShowTerminator,
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
          <Label htmlFor="trails" className="flex items-center gap-2 text-sm cursor-pointer">
            <Route className="w-4 h-4 text-muted-foreground" />
            Satellite Trails
          </Label>
          <Switch
            id="trails"
            checked={showTrails}
            onCheckedChange={setShowTrails}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="terminator" className="flex items-center gap-2 text-sm cursor-pointer">
            <Sun className="w-4 h-4 text-muted-foreground" />
            Day/Night Line
          </Label>
          <Switch
            id="terminator"
            checked={showTerminator}
            onCheckedChange={setShowTerminator}
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
      </div>
    </Card>
  );
}
