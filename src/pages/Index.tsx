import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      {/* <Dashboard /> */}
    </main>
  );
};

export default Index;
