import { Card } from "@/components/ui/card";
import { Brain, Zap, Shield, Database, TrendingUp, Bell } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "LSTM Autoencoder",
    description: "Advanced neural network architecture that learns normal satellite behavior patterns to identify anomalies.",
    color: "text-primary",
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "High-frequency TLE data processing with instant anomaly detection and low-latency alerts.",
    color: "text-warning",
  },
  {
    icon: Shield,
    title: "Anomaly Detection",
    description: "Automatically flag unannounced maneuvers, tumbling, and system failures with high precision.",
    color: "text-success",
  },
  {
    icon: Database,
    title: "TLE Data Integration",
    description: "Seamless integration with Space-Track.org and other satellite tracking data sources.",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Reconstruction Analysis",
    description: "Monitor reconstruction error spikes to detect deviations from normal orbital patterns.",
    color: "text-secondary",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Intelligent alerting system with customizable thresholds and notification preferences.",
    color: "text-destructive",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Machine Learning-Powered Detection
          </h2>
          <p className="text-xl text-muted-foreground">
            Unlike traditional physics-based predictions, our ML model learns what "normal" looks like
            and automatically identifies anomalous behavior.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-smooth hover:glow-cyan group"
              >
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-cyan transition-smooth`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
