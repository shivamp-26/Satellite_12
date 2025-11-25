import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Satellite } from "lucide-react";
import { SatelliteData } from "@/lib/satellite-utils";

interface SatelliteSearchProps {
  satellites: SatelliteData[];
  onSelect: (satellite: SatelliteData) => void;
  selectedId?: string;
}

export default function SatelliteSearch({ satellites, onSelect, selectedId }: SatelliteSearchProps) {
  const [query, setQuery] = useState("");

  const filteredSatellites = satellites.filter((sat) =>
    sat.name.toLowerCase().includes(query.toLowerCase()) ||
    sat.noradId.includes(query)
  );

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search satellites..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-muted/30 border-border"
        />
      </div>
      
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {filteredSatellites.map((sat) => (
          <button
            key={sat.id}
            onClick={() => onSelect(sat)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
              selectedId === sat.id 
                ? 'bg-primary/20 border border-primary/30' 
                : 'hover:bg-muted/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              selectedId === sat.id ? 'bg-primary/20' : 'bg-muted/30'
            }`}>
              <Satellite className={`w-3 h-3 ${
                selectedId === sat.id ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{sat.name}</p>
              <p className="text-xs text-muted-foreground">{sat.noradId}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
