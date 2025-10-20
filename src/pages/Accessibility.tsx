
import Navbar from "@/components/Navbar";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Declaração de </span>
            <span className="text-cyan-400">Acessibilidade</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl">
            Nosso compromisso com acessibilidade digital para todos os profissionais de saúde.
          </p>
          <p className="text-sm text-gray-500 mb-12 pb-8 border-b border-gray-800">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              1. Nosso Compromisso
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              A plataforma Exames está comprometida em garantir acessibilidade digital para profissionais de saúde com deficiências. Trabalhamos continuamente para melhorar a experiência de todos os usuários e aplicar os padrões de acessibilidade relevantes.
            </p>
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-6">
              <p className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">♿</span>
                Padrão WCAG 2.1 Nível AA
              </p>
              <p className="text-gray-300">
                Nosso objetivo é estar em conformidade com as <strong className="text-white">Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1</strong> no nível AA.
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              2. Recursos de Acessibilidade Implementados
            </h2>
            
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-3">
              <span className="text-2xl">⌨️</span>
              Navegação por Teclado
            </h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Tab:</strong> Navegar entre elementos interativos</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Enter/Space:</strong> Ativar botões e selecionar opções</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Esc:</strong> Fechar diálogos e menus</div>
              </li>
            </ul>

            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-3 mt-8">
              <span className="text-2xl">🔊</span>
              Compatibilidade com Leitores de Tela
            </h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Atributos ARIA em componentes complexos</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Labels descritivos em todos os campos de formulário</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Testado com NVDA (Windows) e VoiceOver (macOS/iOS)</span>
              </li>
            </ul>

            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-3 mt-8">
              <span className="text-2xl">🎨</span>
              Design Visual Acessível
            </h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Alto contraste:</strong> Tema com contraste mínimo 4.5:1</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Cores:</strong> Informações não dependem apenas de cor</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Foco visível:</strong> Indicadores claros em elementos interativos</div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              3. Tecnologias Assistivas Suportadas
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              A plataforma foi testada com:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Leitores de Tela:</strong> NVDA, JAWS, VoiceOver, TalkBack</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Navegadores:</strong> Chrome, Firefox, Safari, Edge</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Ampliadores:</strong> ZoomText, Windows Magnifier</div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              4. Feedback e Suporte
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Valorizamos seu feedback sobre a acessibilidade da plataforma. Se você encontrar barreiras, entre em contato:
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-3">
              <p className="text-gray-300">
                <strong className="text-white font-semibold">Email:</strong>{" "}
                <a href="mailto:acessibilidade@exames.app" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  acessibilidade@exames.app
                </a>
              </p>
              <p className="text-gray-300">
                <strong className="text-white font-semibold">Tempo de Resposta:</strong> Até 5 dias úteis
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              5. Melhoria Contínua
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Nosso compromisso com acessibilidade é contínuo:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Testes regulares com usuários de tecnologias assistivas</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Auditoria anual de acessibilidade por especialistas</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Treinamento da equipe em práticas de acessibilidade</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Atualizações de acordo com feedback dos usuários</span>
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Esta declaração foi criada em {new Date().toLocaleDateString('pt-BR')} e é revisada a cada 6 meses.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
