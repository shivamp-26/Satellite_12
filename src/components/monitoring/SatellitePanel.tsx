import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, Globe, Clock, Compass, ArrowUp, ArrowDown, Flag, Rocket, Target } from "lucide-react";
import { SatelliteData } from "@/lib/satellite-utils";
import { getCountryFlag } from "@/lib/satellite-database";

interface SatellitePanelProps {
  satellite: SatelliteData | null;
}

export default function SatellitePanel({ satellite }: SatellitePanelProps) {
  if (!satellite) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Satellite className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Satellite Info</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Select a satellite from the 3D view or search to see detailed information.
        </p>
      </Card>
    );
  }

  const countryFlag = getCountryFlag(satellite.country || '');

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Satellite className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{satellite.name}</h3>
            <p className="text-sm text-muted-foreground">NORAD: {satellite.noradId}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-success/20 text-success border-success/30">
          Active
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Country & Launch Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Flag className="w-3 h-3" /> Country
            </p>
            <p className="font-semibold text-sm flex items-center gap-2">
              <span className="text-lg">{countryFlag}</span>
              {satellite.country || 'Unknown'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Rocket className="w-3 h-3" /> Launch Date
            </p>
            <p className="font-semibold text-sm">{satellite.launchDate || 'Unknown'}</p>
          </div>
        </div>

        {/* Purpose & Operator */}
        {(satellite.purpose || satellite.operator) && (
          <div className="grid grid-cols-1 gap-3">
            {satellite.purpose && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Purpose
                </p>
                <p className="font-semibold text-sm">{satellite.purpose}</p>
              </div>
            )}
            {satellite.operator && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Operator</p>
                <p className="font-semibold text-sm">{satellite.operator}</p>
              </div>
            )}
          </div>
        )}

        {/* Current Position */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Current Position
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground">Latitude</p>
              <p className="font-mono text-sm">{satellite.latitude?.toFixed(2) || '--'}°</p>
            </div>
            <div className="p-2 rounded bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground">Longitude</p>
              <p className="font-mono text-sm">{satellite.longitude?.toFixed(2) || '--'}°</p>
            </div>
            <div className="p-2 rounded bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground">Altitude</p>
              <p className="font-mono text-sm">{satellite.altitude?.toFixed(0) || '--'} km</p>
            </div>
          </div>
        </div>

        {/* Orbital Parameters */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Orbital Parameters
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded bg-muted/20">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" /> Period
              </span>
              <span className="font-mono text-sm">{satellite.period?.toFixed(1) || '--'} min</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/20">
              <span className="text-sm text-muted-foreground">Inclination</span>
              <span className="font-mono text-sm">{satellite.inclination?.toFixed(2) || '--'}°</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/20">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <ArrowUp className="w-3 h-3" /> Apogee
              </span>
              <span className="font-mono text-sm">{satellite.apogee?.toFixed(0) || '--'} km</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/20">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <ArrowDown className="w-3 h-3" /> Perigee
              </span>
              <span className="font-mono text-sm">{satellite.perigee?.toFixed(0) || '--'} km</span>
            </div>
          </div>
        </div>

        {/* Launch Info */}
        {(satellite.launchSite || satellite.launchVehicle) && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              Launch Details
            </h4>
            {satellite.launchSite && (
              <p className="text-xs text-muted-foreground">
                Site: <span className="text-foreground">{satellite.launchSite}</span>
              </p>
            )}
            {satellite.launchVehicle && (
              <p className="text-xs text-muted-foreground">
                Vehicle: <span className="text-foreground">{satellite.launchVehicle}</span>
              </p>
            )}
          </div>
        )}

        {/* Velocity */}
        {satellite.velocity && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Velocity Vector (km/s)</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">X</p>
                <p className="font-mono text-xs">{satellite.velocity.x.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">Y</p>
                <p className="font-mono text-xs">{satellite.velocity.y.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">Z</p>
                <p className="font-mono text-xs">{satellite.velocity.z.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
