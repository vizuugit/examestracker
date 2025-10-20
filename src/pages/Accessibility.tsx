
import Navbar from "@/components/Navbar";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Declaração de Acessibilidade</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Nosso Compromisso</h2>
            <p className="mb-4">A plataforma Exames está comprometida em garantir acessibilidade digital para profissionais de saúde com deficiências. Trabalhamos continuamente para melhorar a experiência de todos os usuários e aplicar os padrões de acessibilidade relevantes.</p>
            <p className="mb-4">Nosso objetivo é estar em conformidade com as <strong>Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1</strong> no nível AA.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Recursos de Acessibilidade Implementados</h2>
            <p className="mb-4">Nossa plataforma médica inclui os seguintes recursos de acessibilidade:</p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Navegação por Teclado</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Tab:</strong> Navegar entre elementos interativos (botões, links, campos)</li>
              <li><strong>Enter/Space:</strong> Ativar botões e selecionar opções</li>
              <li><strong>Esc:</strong> Fechar diálogos e menus</li>
              <li><strong>Setas:</strong> Navegar em menus dropdown e tabelas</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Compatibilidade com Leitores de Tela</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Atributos ARIA (Accessible Rich Internet Applications) em componentes complexos</li>
              <li>Labels descritivos em todos os campos de formulário</li>
              <li>Textos alternativos em gráficos e visualizações de dados</li>
              <li>Anúncios de status para ações assíncronas (upload, processamento)</li>
              <li>Testado com NVDA (Windows) e VoiceOver (macOS/iOS)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Design Visual Acessível</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Alto contraste:</strong> Tema escuro profissional com contraste adequado (mínimo 4.5:1)</li>
              <li><strong>Cores:</strong> Informações não dependem apenas de cor (uso de ícones e textos)</li>
              <li><strong>Tipografia:</strong> Fontes legíveis (Inter/Lato) com tamanhos adequados</li>
              <li><strong>Foco visível:</strong> Indicadores claros de foco em elementos interativos</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Estrutura e Organização</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Estrutura semântica HTML (header, main, section, nav)</li>
              <li>Hierarquia clara de cabeçalhos (H1, H2, H3)</li>
              <li>Landmarks ARIA para navegação rápida</li>
              <li>Tabelas com cabeçalhos apropriados para dados de exames</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Funcionalidades Específicas Acessíveis</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Upload de Exames:</strong> Área de arrastar e soltar com alternativa por clique, feedback visual e sonoro</li>
              <li><strong>Gráficos de Evolução:</strong> Dados disponíveis também em formato de tabela, tooltips descritivos</li>
              <li><strong>Dashboard:</strong> Navegação por teclado completa, cards com informações estruturadas</li>
              <li><strong>Formulários:</strong> Validação com mensagens claras, campos obrigatórios sinalizados</li>
              <li><strong>Diálogos:</strong> Foco automático, escape para fechar, anúncio de abertura</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Recursos Planejados</h2>
            <p className="mb-4">Estamos trabalhando para adicionar:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Ajuste de tamanho de fonte nas configurações do usuário</li>
              <li>Modo de alto contraste adicional (além do tema escuro atual)</li>
              <li>Atalhos de teclado personalizáveis para ações frequentes</li>
              <li>Descrições de áudio para gráficos complexos</li>
              <li>Suporte aprimorado para magnificação de tela</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Tecnologias Assistivas Suportadas</h2>
            <p className="mb-4">A plataforma foi testada com:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Leitores de Tela:</strong> NVDA, JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)</li>
              <li><strong>Navegadores:</strong> Chrome, Firefox, Safari, Edge (versões recentes)</li>
              <li><strong>Ampliadores de Tela:</strong> ZoomText, Windows Magnifier</li>
              <li><strong>Reconhecimento de Voz:</strong> Dragon NaturallySpeaking, Windows Speech Recognition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Feedback e Suporte</h2>
            <p className="mb-4">Valorizamos seu feedback sobre a acessibilidade da plataforma. Se você encontrar barreiras de acessibilidade ou tiver sugestões, por favor entre em contato:</p>
            <p className="mb-2"><strong>Email:</strong> acessibilidade@exames.app</p>
            <p className="mb-2"><strong>Tempo de Resposta:</strong> Nos comprometemos a responder em até 5 dias úteis</p>
            <p className="mb-4">Ao reportar problemas, inclua:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Descrição do problema encontrado</li>
              <li>Página ou funcionalidade afetada</li>
              <li>Tecnologia assistiva utilizada (se aplicável)</li>
              <li>Navegador e sistema operacional</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitações Conhecidas</h2>
            <p className="mb-4">Estamos cientes das seguintes limitações e trabalhando para resolvê-las:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Alguns gráficos complexos podem ter descrições limitadas em leitores de tela</li>
              <li>Upload de arquivos por arrastar e soltar pode ter suporte limitado em alguns leitores de tela (use a alternativa por clique)</li>
              <li>PDFs de exames originais podem não ser acessíveis (dependem do laboratório que os gerou)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Melhoria Contínua</h2>
            <p className="mb-4">Nosso compromisso com acessibilidade é contínuo:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Testes regulares com usuários de tecnologias assistivas</li>
              <li>Auditoria anual de acessibilidade por especialistas</li>
              <li>Treinamento da equipe de desenvolvimento em práticas de acessibilidade</li>
              <li>Monitoramento de novas diretrizes e tecnologias</li>
              <li>Atualizações de acordo com feedback dos usuários</li>
            </ul>
            <p className="mt-4">Esta declaração foi criada em {new Date().toLocaleDateString('pt-BR')} e é revisada a cada 6 meses.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
