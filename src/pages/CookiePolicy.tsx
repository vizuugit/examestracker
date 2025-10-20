
import Navbar from "@/components/Navbar";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Política de </span>
            <span className="text-cyan-400">Cookies</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl">
            Como utilizamos cookies para melhorar sua experiência na plataforma.
          </p>
          <p className="text-sm text-gray-500 mb-12 pb-8 border-b border-gray-800">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="text-cyan-400">1.</span>
              <span className="text-white"> O que são Cookies</span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Cookies são pequenos arquivos de texto armazenados no seu computador ou dispositivo móvel quando você visita nossa plataforma. Eles nos ajudam a fornecer uma experiência melhor e permitem que determinadas funcionalidades funcionem corretamente.
            </p>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Cookies não contêm vírus e não podem acessar informações do seu computador além daquelas que você fornece ao navegar na plataforma.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="text-cyan-400">2.</span>
              <span className="text-white"> Cookies que Utilizamos</span>
            </h2>
            
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              Cookies Essenciais (Sempre Ativos)
            </h3>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Estes cookies são necessários para o funcionamento básico da plataforma e não podem ser desativados:
            </p>
            <ul className="space-y-6 mb-8">
              <li className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-6">
                <strong className="text-white font-semibold text-lg block mb-3">sb-access-token</strong>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Finalidade:</strong> Autenticação do usuário (Supabase Auth)</div>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Duração:</strong> Sessão (expira ao fechar o navegador ou após 1 hora de inatividade)</div>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Necessário para:</strong> Manter você conectado à plataforma</div>
                  </li>
                </ul>
              </li>
              <li className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-6">
                <strong className="text-white font-semibold text-lg block mb-3">sb-refresh-token</strong>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Finalidade:</strong> Renovação automática da sessão</div>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Duração:</strong> 30 dias</div>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Necessário para:</strong> Evitar que você precise fazer login repetidamente</div>
                  </li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-3 mt-12">
              <span className="text-2xl">📊</span>
              Cookies de Analytics (Opcional)
            </h3>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Usamos Google Analytics para entender como os profissionais usam a plataforma e identificar melhorias:
            </p>
            <ul className="space-y-6 mb-8">
              <li className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-6">
                <strong className="text-white font-semibold text-lg block mb-3">_ga</strong>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Finalidade:</strong> Distinguir usuários únicos</div>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Duração:</strong> 2 anos</div>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400/60 mt-1">→</span>
                    <div><strong className="text-white">Informações coletadas:</strong> ID anônimo, páginas visitadas, tempo de permanência</div>
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="text-cyan-400">3.</span>
              <span className="text-white"> Como Usamos Cookies</span>
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Autenticação:</strong> Manter sua sessão ativa e segura</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Análise de Uso:</strong> Entender como profissionais navegam na plataforma</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Melhorias:</strong> Identificar funcionalidades mais usadas e pontos de dificuldade</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Segurança:</strong> Detectar atividades suspeitas e proteger contra ataques</div>
              </li>
            </ul>
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-6">
              <p className="text-cyan-400 font-semibold mb-3">NÃO usamos cookies para:</p>
              <ul className="space-y-2">
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-red-400">❌</span> Publicidade direcionada
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-red-400">❌</span> Rastreamento entre sites (cross-site tracking)
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-red-400">❌</span> Vender dados para terceiros
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="text-cyan-400">4.</span>
              <span className="text-white"> Gerenciamento de Cookies</span>
            </h2>
            
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100">
              Desabilitar Cookies via Navegador
            </h3>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Você pode controlar e excluir cookies através das configurações do seu navegador:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Google Chrome:</strong> Configurações → Privacidade e segurança → Cookies e outros dados do site</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Firefox:</strong> Opções → Privacidade e Segurança → Cookies e dados de sites</div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div><strong className="text-white font-semibold">Safari:</strong> Preferências → Privacidade → Gerenciar dados de sites</div>
              </li>
            </ul>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
              <p className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Impacto de Desabilitar Cookies
              </p>
              <ul className="space-y-3">
                <li className="text-gray-300 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  <div><strong className="text-white">Cookies Essenciais:</strong> Se desabilitados, você NÃO conseguirá fazer login ou usar a plataforma</div>
                </li>
                <li className="text-gray-300 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  <div><strong className="text-white">Cookies de Analytics:</strong> A plataforma funcionará normalmente, mas não poderemos melhorar a experiência com base em dados de uso</div>
                </li>
              </ul>
            </div>

            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100">
              Opt-Out do Google Analytics
            </h3>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Para desabilitar especificamente o Google Analytics: Instale o{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                Add-on de Desativação do Google Analytics
              </a>
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="text-cyan-400">5.</span>
              <span className="text-white"> Dúvidas sobre Cookies</span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Se você tiver perguntas sobre nossa utilização de cookies, entre em contato:
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-3">
              <p className="text-gray-300">
                <strong className="text-white font-semibold">Email:</strong>{" "}
                <a href="mailto:cookies@exames.app" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  cookies@exames.app
                </a>
              </p>
              <p className="text-gray-300">
                Consulte também nossa{" "}
                <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
