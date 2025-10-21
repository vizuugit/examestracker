import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BiomarkerChart } from "@/components/BiomarkerChart";
import { Upload, Bot, FileText, Download, TrendingUp, TrendingDown, FileSpreadsheet, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const Demo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Simular upload automático
    const uploadTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => startProcessing(), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }, 1000);

    return () => clearTimeout(uploadTimer);
  }, []);

  const startProcessing = () => {
    const steps = [0, 1, 2, 3];
    steps.forEach((step, index) => {
      setTimeout(() => {
        setProcessingStep(step + 1);
        if (step === 3) {
          setTimeout(() => setShowResults(true), 500);
        }
      }, index * 800);
    });
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black">
      <PublicNavbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-96 h-96 bg-rest-blue/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rest-blue/20 to-rest-cyan/10 rounded-full border border-rest-blue/30 backdrop-blur-sm mb-8">
                <span className="text-sm font-medium text-white">Demonstração Interativa</span>
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
                <span className="text-sm text-yellow-200">💡 Todos os dados mostrados são fictícios para demonstração</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Upload */}
        <section className="py-12 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
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
                    
                    {uploadProgress > 0 && (
                      <div className="mt-6">
                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-rest-blue to-rest-cyan h-full transition-all duration-300 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-rest-lightblue text-sm mt-2">
                          {uploadProgress === 100 ? "✓ Upload concluído!" : `Enviando... ${uploadProgress}%`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 2: Processing */}
        {uploadProgress === 100 && (
          <section className="py-12 relative animate-fade-in">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
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
                          className={`flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 transition-all duration-500 ${
                            processingStep > index ? 'opacity-100' : 'opacity-30'
                          }`}
                        >
                          {processingStep > index ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 border-2 border-white/30 rounded-full flex-shrink-0 animate-pulse" />
                          )}
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
          </section>
        )}

        {/* Section 3: Table */}
        {showResults && (
          <section className="py-12 relative animate-fade-in">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
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
          </section>
        )}

        {/* Section 4: Charts */}
        {showResults && (
          <section className="py-12 relative animate-fade-in">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">4. Gráficos de Evolução</h2>
                  <p className="text-white/70">Visualize tendências ao longo do tempo</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockBiomarkerData.map((biomarker, index) => (
                    <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
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
          </section>
        )}

        {/* Section 5: Export */}
        {showResults && (
          <section className="py-12 relative animate-fade-in">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
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
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        {showResults && (
          <section className="py-20 relative animate-fade-in">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-rest-blue/10 to-rest-cyan/5 rounded-full blur-3xl" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Pronto para Começar?
                </h2>
                <p className="text-xl text-white/70 mb-8">
                  Transforme o acompanhamento dos seus pacientes com inteligência artificial
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <CheckCircle2 className="w-8 h-8 text-rest-lightblue mx-auto mb-3" />
                    <p className="text-white font-semibold">Upload Ilimitado</p>
                    <p className="text-white/60 text-sm mt-2">Todos os exames dos seus pacientes</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <CheckCircle2 className="w-8 h-8 text-rest-lightblue mx-auto mb-3" />
                    <p className="text-white font-semibold">IA Avançada</p>
                    <p className="text-white/60 text-sm mt-2">Análise automática de laudos</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <CheckCircle2 className="w-8 h-8 text-rest-lightblue mx-auto mb-3" />
                    <p className="text-white font-semibold">Relatórios Profissionais</p>
                    <p className="text-white/60 text-sm mt-2">Exportação em PDF e Excel</p>
                  </div>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-12 py-6 text-xl hover-scale group"
                >
                  Criar Conta Gratuitamente
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Demo;