import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BiomarkerChart } from "@/components/BiomarkerChart";
import { Upload, Bot, FileText, Download, TrendingDown, FileSpreadsheet, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { TourProgress } from "@/components/tour/TourProgress";
import { TourNavigation } from "@/components/tour/TourNavigation";
import { TourTooltip } from "@/components/tour/TourTooltip";
import { SkipTourButton } from "@/components/tour/SkipTourButton";

const Demo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const totalSteps = 5;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Scroll suave para a seção ativa
    if (sectionRefs.current[currentStep]) {
      sectionRefs.current[currentStep]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentStep]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentStep < totalSteps - 1) {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        handlePrevious();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const handleComplete = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('id', user.id);
      
      toast({
        title: "🎉 Parabéns!",
        description: "Você está pronto para começar. Agora sabe como fazer upload, visualizar gráficos e exportar relatórios!",
      });
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('id', user.id);
    }
    navigate(user ? '/dashboard' : '/auth');
  };

  const handleExportClick = () => {
    toast({
      title: "Demonstração",
      description: "Crie sua conta para exportar relatórios reais!",
    });
  };

  const mockBiomarkerData = [
    {
      biomarkerName: "Colesterol LDL",
      unit: "mg/dL",
      referenceMin: 50,
      referenceMax: 100,
      data: [
        { exam_date: "2024-01-15", value_numeric: 165, status: "alto", laboratory: "Laboratório Demo" },
        { exam_date: "2024-03-20", value_numeric: 152, status: "alto", laboratory: "Laboratório Demo" },
        { exam_date: "2024-05-10", value_numeric: 145, status: "alto", laboratory: "Laboratório Demo" },
      ]
    },
    {
      biomarkerName: "Glicemia em Jejum",
      unit: "mg/dL",
      referenceMin: 70,
      referenceMax: 100,
      data: [
        { exam_date: "2024-01-15", value_numeric: 98, status: "normal", laboratory: "Laboratório Demo" },
        { exam_date: "2024-03-20", value_numeric: 94, status: "normal", laboratory: "Laboratório Demo" },
        { exam_date: "2024-05-10", value_numeric: 92, status: "normal", laboratory: "Laboratório Demo" },
      ]
    }
  ];

  const extractedData = [
    { label: "Colesterol LDL", value: "145 mg/dL", status: "alto" },
    { label: "Glicemia", value: "92 mg/dL", status: "normal" },
    { label: "Hemoglobina", value: "14.2 g/dL", status: "normal" },
    { label: "Triglicerídeos", value: "160 mg/dL", status: "alto" },
  ];

  const stepTooltips = [
    {
      title: "💡 Dica Pro",
      description: "Comece fazendo upload de um laudo em PDF. Aceitamos documentos de qualquer laboratório.",
      example: "Exemplo: Arraste um PDF de exame de sangue e veja a mágica acontecer."
    },
    {
      title: "💡 Dica Pro",
      description: "Nossa IA extrai e organiza automaticamente todos os biomarcadores, economizando horas do seu tempo.",
      example: "Exemplo: Em segundos, extraímos todos os valores de colesterol, glicemia, hemograma completo e muito mais."
    },
    {
      title: "💡 Dica Pro",
      description: "Visualize o histórico completo com tendências automáticas. Perfeito para consultas rápidas.",
      example: "Exemplo: Acompanhe a evolução do colesterol de um paciente diabético ao longo de 6 meses."
    },
    {
      title: "💡 Dica Pro",
      description: "Acompanhe a evolução visual ao longo do tempo. Ideal para compartilhar com pacientes.",
      example: "Exemplo: Mostre ao paciente como sua glicemia melhorou após mudanças na dieta."
    },
    {
      title: "💡 Dica Pro",
      description: "Gere relatórios profissionais em PDF ou Excel para compartilhar com pacientes e colegas.",
      example: "Exemplo: Exporte um relatório completo para enviar ao endocrinologista do seu paciente."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black">
      <PublicNavbar showOnlyBackButton={true} />
      
      <TourProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={handleStepClick}
      />
      
      <SkipTourButton onSkip={handleSkip} />
      
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-96 h-96 bg-rest-blue/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/10 rounded-full border border-rest-blue/30 backdrop-blur-sm mb-8">
                <Sparkles className="w-4 h-4 text-rest-lightblue mr-2" />
                <span className="text-sm font-medium text-white">Tour Interativo • 2 minutos</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Veja Como Funciona
                <span className="block bg-gradient-to-r from-rest-lightblue to-rest-cyan bg-clip-text text-transparent">
                  na Prática
                </span>
              </h1>
              <p className="text-xl text-white/70 leading-relaxed mb-8">
                Acompanhe passo a passo como transformamos laudos médicos em PDF em dados estruturados, gráficos e relatórios profissionais.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                <span className="text-sm text-yellow-200">💡 Use as setas do teclado ou botões para navegar</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Upload */}
        <section
          ref={(el) => (sectionRefs.current[0] = el)}
          className={`py-12 relative transition-all duration-500 ${
            currentStep === 0 ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {currentStep === 0 && (
                <div className="absolute -inset-4 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/20 rounded-3xl blur-2xl animate-pulse" />
              )}
              <div className="relative">
                {currentStep === 0 && <TourTooltip {...stepTooltips[0]} />}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">1. Upload de Exame</h2>
                  <p className="text-white/70">Arraste seu PDF ou clique para selecionar</p>
                </div>
                
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-12">
                    <div className="border-2 border-dashed border-rest-blue/30 rounded-2xl p-12 text-center hover:border-rest-blue/50 transition-colors bg-rest-blue/5">
                      <Upload className="w-16 h-16 text-rest-lightblue mx-auto mb-4" />
                      <p className="text-white font-semibold text-lg mb-2">Arraste seu PDF aqui</p>
                      <p className="text-white/60 text-sm mb-4">ou clique para selecionar</p>
                      
                      {currentStep >= 0 && (
                        <div className="mt-6">
                          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-rest-blue to-rest-cyan h-full transition-all duration-300 rounded-full"
                              style={{ width: "100%" }}
                            />
                          </div>
                          <p className="text-rest-lightblue text-sm mt-2">✓ Upload concluído!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Processing */}
        <section
          ref={(el) => (sectionRefs.current[1] = el)}
          className={`py-12 relative transition-all duration-500 ${
            currentStep === 1 ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {currentStep === 1 && (
                <div className="absolute -inset-4 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/20 rounded-3xl blur-2xl animate-pulse" />
              )}
              <div className="relative">
                {currentStep === 1 && <TourTooltip {...stepTooltips[1]} />}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">2. Processamento com IA</h2>
                  <p className="text-white/70">Extração inteligente de dados</p>
                </div>
                
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center mb-8">
                      <Bot className="w-16 h-16 text-rest-lightblue animate-pulse" />
                    </div>
                    
                    <div className="space-y-4">
                      {extractedData.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 opacity-100"
                        >
                          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-white font-medium">{item.label}:</span>
                            <span className={`ml-2 ${
                              item.status === 'alto' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {item.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Table */}
        <section
          ref={(el) => (sectionRefs.current[2] = el)}
          className={`py-12 relative transition-all duration-500 ${
            currentStep === 2 ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {currentStep === 2 && (
                <div className="absolute -inset-4 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/20 rounded-3xl blur-2xl animate-pulse" />
              )}
              <div className="relative">
                {currentStep === 2 && <TourTooltip {...stepTooltips[2]} />}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">3. Tabela de Acompanhamento</h2>
                  <p className="text-white/70">Histórico completo com tendências automáticas</p>
                </div>
                
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-4 text-white font-semibold">Biomarcador</th>
                            <th className="text-center py-4 px-4 text-white font-semibold">15/01/24</th>
                            <th className="text-center py-4 px-4 text-white font-semibold">20/03/24</th>
                            <th className="text-center py-4 px-4 text-white font-semibold">10/05/24</th>
                            <th className="text-center py-4 px-4 text-white font-semibold">Tendência</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 text-white">Colesterol LDL</td>
                            <td className="text-center py-4 px-4 text-yellow-400">165</td>
                            <td className="text-center py-4 px-4 text-yellow-400">152</td>
                            <td className="text-center py-4 px-4 text-yellow-400">145</td>
                            <td className="text-center py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <TrendingDown className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-semibold">↓ 12.1%</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 text-white">Glicemia</td>
                            <td className="text-center py-4 px-4 text-green-400">98</td>
                            <td className="text-center py-4 px-4 text-green-400">94</td>
                            <td className="text-center py-4 px-4 text-green-400">92</td>
                            <td className="text-center py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <TrendingDown className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-semibold">↓ 6.1%</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Charts */}
        <section
          ref={(el) => (sectionRefs.current[3] = el)}
          className={`py-12 relative transition-all duration-500 ${
            currentStep === 3 ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {currentStep === 3 && (
                <div className="absolute -inset-4 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/20 rounded-3xl blur-2xl animate-pulse" />
              )}
              <div className="relative">
                {currentStep === 3 && <TourTooltip {...stepTooltips[3]} />}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">4. Gráficos de Evolução</h2>
                  <p className="text-white/70">Visualize tendências ao longo do tempo</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockBiomarkerData.map((biomarker, index) => (
                    <div key={index}>
                      <BiomarkerChart
                        biomarkerName={biomarker.biomarkerName}
                        data={biomarker.data}
                        unit={biomarker.unit}
                        referenceMin={biomarker.referenceMin}
                        referenceMax={biomarker.referenceMax}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Export */}
        <section
          ref={(el) => (sectionRefs.current[4] = el)}
          className={`py-12 relative transition-all duration-500 ${
            currentStep === 4 ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {currentStep === 4 && (
                <div className="absolute -inset-4 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/20 rounded-3xl blur-2xl animate-pulse" />
              )}
              <div className="relative">
                {currentStep === 4 && <TourTooltip {...stepTooltips[4]} />}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">5. Exportação de Relatórios</h2>
                  <p className="text-white/70">Compartilhe com pacientes e colegas</p>
                </div>
                
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                      <Button 
                        onClick={handleExportClick}
                        className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-8 py-6 text-lg group w-full md:w-[220px]"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Exportar PDF
                        <Download className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
                      </Button>
                      
                      <Button 
                        onClick={handleExportClick}
                        className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-8 py-6 text-lg group w-full md:w-[220px]"
                      >
                        <FileSpreadsheet className="w-5 h-5 mr-2" />
                        Exportar Excel
                        <Download className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {currentStep === 4 && (
                  <div className="mt-12 text-center animate-fade-in">
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30 backdrop-blur-sm mb-6">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-white font-medium">Agora você sabe como:</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                      <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <span className="text-white/80 text-sm">✓ Fazer upload de laudos</span>
                      </div>
                      <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <span className="text-white/80 text-sm">✓ Visualizar gráficos de evolução</span>
                      </div>
                      <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <span className="text-white/80 text-sm">✓ Exportar relatórios profissionais</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <TourNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={handleComplete}
      />
      
      <Footer />
    </div>
  );
};

export default Demo;
