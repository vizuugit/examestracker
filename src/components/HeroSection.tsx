import { useState, useEffect } from "react";
import { ArrowRight, Upload, Brain, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import exLogo from "@/assets/ex-logo.png";

const HeroSection = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [statsCounter, setStatsCounter] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setStatsCounter(prev => (prev < 100 ? prev + 1 : 100));
    }, 50);
    setTimeout(() => clearInterval(interval), 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="inicio" className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-rest-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-rest-cyan/5 to-transparent rounded-full blur-3xl animate-spin-slow" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:50px_50px] opacity-20" />

      <div className="relative z-10 container mx-auto px-4 pt-8 pb-8 min-h-screen flex items-start">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
          <div className={`space-y-6 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                Transforme o
                <span className="block bg-gradient-to-r from-rest-lightblue to-rest-cyan bg-clip-text text-transparent">
                  Acompanhamento dos Seus Pacientes
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
                Plataforma Inteligente de gestão de exames com IA. Automatize a análise de laudos e visualize a evolução dos seus pacientes.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-8 py-4 text-lg hover-scale group"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-rest-lightblue">Qualquer Formato</div>
                <div className="text-sm text-white/70">PDF / PNG / HEIC</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rest-lightblue">IA</div>
                <div className="text-sm text-white/70">Insights Clínicos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rest-lightblue">Cloud</div>
                <div className="text-sm text-white/70">100% Online</div>
              </div>
            </div>
          </div>

          {/* Right Content - Features */}
          <div className={`space-y-8 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            {/* Enhanced Visual */}
            <div className="relative group">
              <div className="absolute -inset-8 bg-gradient-to-r from-rest-blue/20 to-white/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700" />
              <div className="relative rounded-3xl overflow-hidden border border-white/20 backdrop-blur-sm bg-white/5 p-8 hover-scale flex items-center justify-center">
                <div className="text-center space-y-3">
                  <img src={exLogo} alt="EX Logo" className="w-48 h-48 object-contain mx-auto" />
                  <h3 className="text-xl font-bold text-white">Processamento com IA</h3>
                  <p className="text-sm text-white/70">Extração inteligente de dados</p>
                </div>
              </div>
            </div>

            {/* Quick Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-rest-blue/30 transition-colors hover-scale">
                <Upload className="w-6 h-6 text-rest-lightblue mb-2" />
                <div className="text-sm font-medium text-white">Upload Rápido</div>
                <div className="text-xs text-white/70">PDFs em segundos</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-rest-blue/30 transition-colors hover-scale">
                <img src={exLogo} alt="EX Logo" className="w-16 h-16 object-contain mb-2" />
                <div className="text-sm font-medium text-white">IA Inteligente</div>
                <div className="text-xs text-white/70">Análise automática</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-rest-blue/30 transition-colors hover-scale">
                <TrendingUp className="w-6 h-6 text-rest-lightblue mb-2" />
                <div className="text-sm font-medium text-white">Gráficos Evolutivos</div>
                <div className="text-xs text-white/70">Acompanhe tendências</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-rest-blue/30 transition-colors hover-scale">
                <Shield className="w-6 h-6 text-rest-lightblue mb-2" />
                <div className="text-sm font-medium text-white">100% Seguro</div>
                <div className="text-xs text-white/70">Dados protegidos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;