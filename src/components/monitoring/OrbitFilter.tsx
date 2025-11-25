import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { getOrbitColor } from '@/lib/tle-parser';

interface OrbitFilterProps {
  filters: ('LEO' | 'MEO' | 'GEO' | 'HEO')[];
  onChange: (filters: ('LEO' | 'MEO' | 'GEO' | 'HEO')[]) => void;
  counts: { LEO: number; MEO: number; GEO: number; HEO: number };
}

const ORBIT_INFO = {
  LEO: { label: 'LEO', description: 'Low Earth Orbit (<2000km)' },
  MEO: { label: 'MEO', description: 'Medium Earth Orbit' },
  GEO: { label: 'GEO', description: 'Geostationary Orbit' },
  HEO: { label: 'HEO', description: 'High Elliptical Orbit' },
};

export default function OrbitFilter({ filters, onChange, counts }: OrbitFilterProps) {
  const toggleFilter = (orbit: 'LEO' | 'MEO' | 'GEO' | 'HEO') => {
    if (filters.includes(orbit)) {
      onChange(filters.filter(f => f !== orbit));
    } else {
      onChange([...filters, orbit]);
    }
  };
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Orbit Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.keys(ORBIT_INFO) as ('LEO' | 'MEO' | 'GEO' | 'HEO')[]).map((orbit) => (
          <div key={orbit} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id={orbit}
                checked={filters.includes(orbit)}
                onCheckedChange={() => toggleFilter(orbit)}
              />
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getOrbitColor(orbit) }}
              />
              <Label htmlFor={orbit} className="text-sm cursor-pointer">
                {ORBIT_INFO[orbit].label}
              </Label>
            </div>
            <span className="text-xs text-muted-foreground">
              {counts[orbit]}
            </span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Total visible: {filters.reduce((acc, f) => acc + counts[f], 0)}
        </p>
      </CardContent>
    </Card>
  );
}
