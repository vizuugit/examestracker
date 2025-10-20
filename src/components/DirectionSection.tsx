import { Upload, Bot, BarChart3, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DirectionSection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-rest-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
            Como
            <span className="block bg-gradient-to-r from-rest-lightblue to-rest-cyan bg-clip-text text-transparent">
              Funciona
            </span>
          </h2>
          <p className="text-xl text-white/70 leading-relaxed">
            Em apenas 4 passos simples, transforme PDFs de exames em dados estruturados e visualizações inteligentes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="group relative">
              {/* Connector Line (Desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[calc(50%+4rem)] w-full h-0.5 bg-gradient-to-r from-rest-blue/50 to-transparent" />
              )}
              
              <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:border-rest-blue/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative z-10">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-rest-blue/20 transition-colors">
                  <step.icon className="w-8 h-8 text-rest-lightblue" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 text-center">{step.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed text-center">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <p className="text-white/70 mb-6 text-lg">
            Pronto para revolucionar o acompanhamento dos seus pacientes?
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate('/demo')}
              className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-8 py-4 rounded-full text-lg hover-scale transition-all"
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const steps = [
  {
    icon: Upload,
    title: "Upload de PDF",
    description: "Faça upload do laudo médico em PDF. Arraste e solte ou clique para selecionar o arquivo."
  },
  {
    icon: Bot,
    title: "IA Processa",
    description: "Nossa IA extrai automaticamente todos os dados: biomarcadores, valores, referências e datas."
  },
  {
    icon: BarChart3,
    title: "Visualize Gráficos",
    description: "Veja gráficos de evolução temporal e compare resultados de diferentes exames facilmente."
  },
  {
    icon: Download,
    title: "Exporte Relatórios",
    description: "Gere relatórios em PDF profissionais para compartilhar com pacientes ou colegas."
  }
];

export default DirectionSection;
