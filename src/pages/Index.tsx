import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Waves, TrendingUp, Shield, Globe } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Waves className="h-20 w-20 mx-auto mb-6 text-primary" />
          <h1 className="text-5xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
            Ocean Vision Data
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional marine trade data analysis platform with AI-powered forecasting
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/explorer')} className="shadow-ocean">
              Start Exploring
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-secondary" />
            <h3 className="text-lg font-semibold mb-2">Real-time Data</h3>
            <p className="text-muted-foreground">Access UN Comtrade marine product trade data</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card">
            <Shield className="h-12 w-12 mx-auto mb-4 text-secondary" />
            <h3 className="text-lg font-semibold mb-2">AI Forecasting</h3>
            <p className="text-muted-foreground">Premium predictions for market trends</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card">
            <Globe className="h-12 w-12 mx-auto mb-4 text-secondary" />
            <h3 className="text-lg font-semibold mb-2">Multi-language</h3>
            <p className="text-muted-foreground">Available in Spanish and English</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
