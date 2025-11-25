import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimeControlProps {
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [
  { value: 1, label: '1x' },
  { value: 10, label: '10x' },
  { value: 60, label: '60x' },
  { value: 600, label: '10min/s' },
  { value: 3600, label: '1hr/s' },
];

export default function TimeControl({
  currentTime,
  onTimeChange,
  isPlaying,
  onPlayPause,
  speed,
  onSpeedChange,
}: TimeControlProps) {
  const [sliderValue, setSliderValue] = useState(50);
  
  // Convert speed to slider value (logarithmic scale)
  useEffect(() => {
    const logValue = Math.log10(speed);
    const normalized = (logValue / Math.log10(3600)) * 100;
    setSliderValue(Math.max(0, Math.min(100, normalized)));
  }, [speed]);
  
  const handleSliderChange = (values: number[]) => {
    const value = values[0];
    setSliderValue(value);
    // Convert slider to speed (logarithmic scale)
    const newSpeed = Math.pow(10, (value / 100) * Math.log10(3600));
    onSpeedChange(Math.max(1, Math.round(newSpeed)));
  };
  
  const handleReset = () => {
    onTimeChange(new Date());
  };
  
  const getSpeedLabel = () => {
    if (speed >= 3600) return `${(speed / 3600).toFixed(1)}hr/s`;
    if (speed >= 60) return `${(speed / 60).toFixed(0)}min/s`;
    return `${speed}x`;
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Time Control</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {format(currentTime, 'yyyy-MM-dd HH:mm:ss')} UTC
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10"
          onClick={handleReset}
          title="Reset to current time"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 px-2">
          <Slider
            value={[sliderValue]}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-sm font-mono w-16 text-right text-primary">
          {getSpeedLabel()}
        </span>
      </div>
      
      <div className="flex gap-1 justify-center">
        {SPEED_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={speed === opt.value ? 'default' : 'ghost'}
            size="sm"
            className="text-xs px-2 h-6"
            onClick={() => onSpeedChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
