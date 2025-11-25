import { Card } from "@/components/ui/card";
import { Database, Brain, Activity, AlertTriangle } from "lucide-react";

const steps = [
  {
    icon: Database,
    title: "Data Collection",
    description: "Gather historical TLE data from Space-Track.org for stable, well-behaved satellites to establish normal behavior patterns.",
    step: "01",
  },
  {
    icon: Brain,
    title: "Model Training",
    description: "Train the LSTM Autoencoder on sequences of normal orbital elements until it can accurately reconstruct them.",
    step: "02",
  },
  {
    icon: Activity,
    title: "Real-time Inference",
    description: "Feed incoming TLE data into the trained model and calculate reconstruction error for each new data point.",
    step: "03",
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    description: "When reconstruction error spikes above threshold, flag it as a potential maneuver or system anomaly.",
    step: "04",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            A four-step process from data collection to real-time anomaly alerts
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="relative p-8 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-smooth overflow-hidden group"
              >
                {/* Step Number Background */}
                <div className="absolute top-4 right-4 text-8xl font-bold text-primary/5 group-hover:text-primary/10 transition-smooth">
                  {step.step}
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-cyan transition-smooth">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-sm font-semibold text-primary mb-2">STEP {step.step}</div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
