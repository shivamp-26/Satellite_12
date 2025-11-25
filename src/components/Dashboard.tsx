import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, Activity, AlertTriangle, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const satellites = [
    { id: "SAT-001", name: "ISS", status: "normal", error: 0.03, lastUpdate: "2 min ago" },
    { id: "SAT-002", name: "Hubble", status: "normal", error: 0.02, lastUpdate: "3 min ago" },
    { id: "SAT-003", name: "GPS-15", status: "warning", error: 0.85, lastUpdate: "1 min ago" },
    { id: "SAT-004", name: "Starlink-1234", status: "normal", error: 0.04, lastUpdate: "4 min ago" },
  ];

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Live Monitoring Dashboard
          </h2>
          <p className="text-xl text-muted-foreground">
            Real-time satellite tracking with instant anomaly detection
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Satellites</p>
                <p className="text-3xl font-bold">142</p>
              </div>
              <Satellite className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Monitoring</p>
                <p className="text-3xl font-bold">138</p>
              </div>
              <Activity className="w-8 h-8 text-success" />
            </div>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border glow-cyan">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Anomalies</p>
                <p className="text-3xl font-bold text-warning">3</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                <p className="text-3xl font-bold">99.8%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </Card>
        </div>
        
        {/* Satellite List */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border max-w-6xl mx-auto">
          <h3 className="text-xl font-bold mb-6">Recent Satellite Activity</h3>
          <div className="space-y-4">
            {satellites.map((sat) => (
              <div 
                key={sat.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Satellite className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{sat.name}</p>
                    <p className="text-sm text-muted-foreground">{sat.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Reconstruction Error</p>
                    <p className={`font-mono font-bold ${sat.error > 0.5 ? 'text-warning' : 'text-success'}`}>
                      {sat.error.toFixed(3)}
                    </p>
                  </div>
                  
                  <Badge 
                    variant={sat.status === "normal" ? "default" : "destructive"}
                    className={sat.status === "normal" ? "bg-success/20 text-success hover:bg-success/30" : "bg-warning/20 text-warning hover:bg-warning/30"}
                  >
                    {sat.status === "normal" ? "Normal" : "Warning"}
                  </Badge>
                  
                  <div className="text-sm text-muted-foreground min-w-[100px] text-right">
                    {sat.lastUpdate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Dashboard;
