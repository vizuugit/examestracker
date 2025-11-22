import { Brain, Target, TrendingUp, Zap } from "lucide-react";
import cactoLogo from "@/assets/cacto-logo.png";

const AboutSection = () => {
  return (
    <section id="about" className="py-32 bg-gradient-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight animate-fade-in">
            Quem Somos
          </h2>
          <p className="text-xl text-white/80 leading-relaxed animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Exame é uma ferramenta da CACTO - Cognitive Analytics for Care Technology & Outcomes. 
            Unimos ciência, tecnologia e cuidado para transformar a saúde.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-32 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-zinc-900/50 to-black/50 border border-white/10 p-8 rounded-2xl backdrop-blur-md text-center transform hover:-translate-y-2 transition-all duration-300 hover:border-white/20"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white tracking-tight">{feature.title}</h3>
              <p className="text-white/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              Nossa História
            </h3>
            <div className="space-y-6 text-lg text-white/80 leading-relaxed">
              <p>
                Nosso propósito é simplificar a complexidade dos dados clínicos e transformá-los em 
                soluções inteligentes que melhoram a vida das pessoas.
              </p>
              <p>
                Acreditamos que saúde é resiliência. Assim como o cacto armazena energia e prospera 
                em ambientes desafiadores, usamos análises cognitivas, inteligência artificial e 
                inovação tecnológica para apoiar profissionais e instituições a alcançarem melhores 
                desfechos clínicos.
              </p>
              <p>
                Combinamos conhecimento médico, ciência de dados e tecnologia de ponta para criar 
                soluções que promovem eficiência nos processos de cuidado, precisão nas decisões 
                em saúde, e resultados reais para pacientes e profissionais.
              </p>
              <p className="font-medium text-white italic">
                Estamos construindo o futuro da saúde com inteligência, simplicidade e impacto.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white p-8">
              <img 
                alt="CACTO Logo" 
                className="w-full h-auto transform hover:scale-105 transition-transform duration-700" 
                src={cactoLogo}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const features = [{
  icon: Zap,
  title: "Eficiência",
  description: "Eficiência nos processos de cuidado com automação inteligente."
}, {
  icon: Target,
  title: "Precisão",
  description: "Precisão nas decisões em saúde através de análise de dados avançada."
}, {
  icon: TrendingUp,
  title: "Resultados",
  description: "Resultados reais para pacientes e profissionais de saúde."
}, {
  icon: Brain,
  title: "Inovação",
  description: "Inteligência artificial e tecnologia de ponta aplicadas à saúde."
}];

export default AboutSection;
