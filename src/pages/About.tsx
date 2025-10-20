import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import cactoLogo from "@/assets/cacto-logo.png";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-4 border-rest-cyan text-rest-cyan">
            🌵 Nossa Identidade
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Quem </span>
            <span className="text-rest-cyan">Somos</span>
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            Conheça a CACTO e nossa missão de transformar a saúde através da tecnologia
          </p>
          <p className="text-sm text-gray-500">
            Última atualização: Janeiro de 2025
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-16">
          {/* Quem Somos */}
          <section>
            <h2 className="text-3xl font-bold text-rest-cyan mb-4">Quem Somos</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              <strong>Exames</strong> é uma ferramenta da <strong>CACTO - Cognitive Analytics for Care Technology & Outcomes</strong>.
              Unimos ciência, tecnologia e cuidado para transformar a saúde. Nosso propósito é 
              simplificar a complexidade dos dados clínicos e transformá-los em soluções inteligentes 
              que melhoram a vida das pessoas.
            </p>
          </section>

          {/* Nossa Essência */}
          <section>
            <h2 className="text-3xl font-bold text-rest-cyan mb-4">Nossa Essência</h2>
            <div className="bg-gradient-to-r from-rest-cyan/10 to-rest-blue/10 border-l-4 border-rest-cyan p-6 rounded-r-lg">
              <p className="text-gray-200 leading-relaxed text-lg italic">
                Acreditamos que <strong className="text-rest-cyan">saúde é resiliência</strong>. Assim como o cacto armazena energia e prospera 
                em ambientes desafiadores, usamos análises cognitivas, inteligência artificial e 
                inovação tecnológica para apoiar profissionais e instituições a alcançarem melhores 
                desfechos clínicos.
              </p>
            </div>
          </section>

          {/* O Que Fazemos */}
          <section>
            <h2 className="text-3xl font-bold text-rest-cyan mb-4">O Que Fazemos</h2>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              Combinamos conhecimento médico, ciência de dados e tecnologia de ponta para criar 
              soluções que transformam a maneira como profissionais de saúde acompanham e cuidam 
              de seus pacientes.
            </p>
          </section>

          {/* Nossos Pilares */}
          <section>
            <h2 className="text-3xl font-bold text-rest-cyan mb-6">Nossos Pilares</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">Eficiência</h3>
                <p className="text-gray-400">
                  Automatizamos processos de cuidado para que profissionais possam focar no que realmente importa: o paciente.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Precisão</h3>
                <p className="text-gray-400">
                  Oferecemos análises baseadas em dados para decisões mais assertivas em saúde.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold text-white mb-2">Resultados</h3>
                <p className="text-gray-400">
                  Entregamos impacto real e mensurável para pacientes e profissionais de saúde.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold text-white mb-2">Inovação</h3>
                <p className="text-gray-400">
                  Utilizamos inteligência artificial e tecnologia de ponta para transformar dados em insights.
                </p>
              </div>
            </div>
          </section>

          {/* Nosso Propósito */}
          <section>
            <h2 className="text-3xl font-bold text-rest-cyan mb-4">Nosso Propósito</h2>
            <p className="text-gray-300 leading-relaxed text-lg mb-8">
              Estamos construindo o futuro da saúde com <strong className="text-rest-cyan">inteligência</strong>, 
              {" "}<strong className="text-rest-cyan">simplicidade</strong> e <strong className="text-rest-cyan">impacto</strong>.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Cada linha de código, cada análise de dados e cada funcionalidade que desenvolvemos 
              tem um objetivo: empoderar profissionais de saúde a oferecerem o melhor cuidado possível, 
              com mais tempo, mais clareza e melhores decisões.
            </p>
          </section>

          {/* Logo CACTO */}
          <section className="text-center py-8">
            <img 
              src={cactoLogo} 
              alt="CACTO Logo" 
              className="w-32 h-32 mx-auto opacity-80 hover:opacity-100 transition-opacity"
            />
            <p className="text-gray-500 mt-4 text-sm">
              CACTO - Cognitive Analytics for Care Technology & Outcomes
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
