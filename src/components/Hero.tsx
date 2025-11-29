import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Satellite, Activity, AlertCircle, AlertTriangle } from "lucide-react";
import heroImage from "@/assets/satellite-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Image Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background z-0" />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
            <Satellite className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">ML-Based Anomaly Prediction</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Satellite Collision &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse">
              Anomaly Prediction
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Leverage Machine Learning Models to predict satellite behavior, detect unannounced maneuvers, 
            and identify system failures before they happen.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Activity className="w-5 h-5 text-success" />
              <span className="text-sm">Real-time Monitoring</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <AlertCircle className="w-5 h-5 text-warning" />
              <span className="text-sm">Instant Alerts</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Satellite className="w-5 h-5 text-primary" />
              <span className="text-sm">TLE Data Processing</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/monitoring">
              <Button variant="hero" size="lg" className="text-base">
                Start Monitoring
              </Button>
            </Link>
            <Link to="/anomaly-prediction">
              <Button variant="outline" size="lg" className="text-base gap-2">
                <AlertTriangle className="h-4 w-4" />
                Anomaly Prediction
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Floating Animation Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </section>
  );
};

export default Hero;
