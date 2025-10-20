
import Navbar from "@/components/Navbar";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Política de Cookies</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. O que são Cookies</h2>
            <p className="mb-4">Cookies são pequenos arquivos de texto armazenados no seu computador ou dispositivo móvel quando você visita nossa plataforma. Eles nos ajudam a fornecer uma experiência melhor e permitem que determinadas funcionalidades funcionem corretamente.</p>
            <p className="mb-4">Cookies não contêm vírus e não podem acessar informações do seu computador além daquelas que você fornece ao navegar na plataforma.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Cookies que Utilizamos</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">🔐 Cookies Essenciais (Sempre Ativos)</h3>
            <p className="mb-4">Estes cookies são necessários para o funcionamento básico da plataforma e não podem ser desativados:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>sb-access-token</strong>
                <ul className="list-circle pl-6 mt-2">
                  <li><strong>Finalidade:</strong> Autenticação do usuário (Supabase Auth)</li>
                  <li><strong>Duração:</strong> Sessão (expira ao fechar o navegador ou após 1 hora de inatividade)</li>
                  <li><strong>Necessário para:</strong> Manter você conectado à plataforma</li>
                </ul>
              </li>
              <li><strong>sb-refresh-token</strong>
                <ul className="list-circle pl-6 mt-2">
                  <li><strong>Finalidade:</strong> Renovação automática da sessão</li>
                  <li><strong>Duração:</strong> 30 dias</li>
                  <li><strong>Necessário para:</strong> Evitar que você precise fazer login repetidamente</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">📊 Cookies de Analytics (Opcional)</h3>
            <p className="mb-4">Usamos Google Analytics para entender como os profissionais usam a plataforma e identificar melhorias:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>_ga</strong>
                <ul className="list-circle pl-6 mt-2">
                  <li><strong>Finalidade:</strong> Distinguir usuários únicos</li>
                  <li><strong>Duração:</strong> 2 anos</li>
                  <li><strong>Informações coletadas:</strong> ID anônimo, páginas visitadas, tempo de permanência</li>
                </ul>
              </li>
              <li><strong>_ga_[ID]</strong>
                <ul className="list-circle pl-6 mt-2">
                  <li><strong>Finalidade:</strong> Manter estado da sessão do Google Analytics</li>
                  <li><strong>Duração:</strong> 2 anos</li>
                </ul>
              </li>
              <li><strong>_gid</strong>
                <ul className="list-circle pl-6 mt-2">
                  <li><strong>Finalidade:</strong> Distinguir usuários únicos (curto prazo)</li>
                  <li><strong>Duração:</strong> 24 horas</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Como Usamos Cookies</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Autenticação:</strong> Manter sua sessão ativa e segura</li>
              <li><strong>Preferências:</strong> Lembrar suas configurações (futuramente)</li>
              <li><strong>Análise de Uso:</strong> Entender como profissionais navegam na plataforma</li>
              <li><strong>Melhorias:</strong> Identificar funcionalidades mais usadas e pontos de dificuldade</li>
              <li><strong>Segurança:</strong> Detectar atividades suspeitas e proteger contra ataques</li>
            </ul>
            <p className="mb-4"><strong>NÃO usamos cookies para:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>❌ Publicidade direcionada</li>
              <li>❌ Rastreamento entre sites (cross-site tracking)</li>
              <li>❌ Vender dados para terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Gerenciamento de Cookies</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Desabilitar Cookies via Navegador</h3>
            <p className="mb-4">Você pode controlar e excluir cookies através das configurações do seu navegador:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Google Chrome:</strong> Configurações → Privacidade e segurança → Cookies e outros dados do site</li>
              <li><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies e dados de sites</li>
              <li><strong>Safari:</strong> Preferências → Privacidade → Gerenciar dados de sites</li>
              <li><strong>Edge:</strong> Configurações → Cookies e permissões de site → Cookies e dados armazenados</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">⚠️ Impacto de Desabilitar Cookies</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Cookies Essenciais:</strong> Se desabilitados, você NÃO conseguirá fazer login ou usar a plataforma</li>
              <li><strong>Cookies de Analytics:</strong> A plataforma funcionará normalmente, mas não poderemos melhorar a experiência com base em dados de uso</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Opt-Out do Google Analytics</h3>
            <p className="mb-4">Para desabilitar especificamente o Google Analytics sem afetar outros cookies:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Instale o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Add-on de Desativação do Google Analytics</a></li>
              <li>Configure o bloqueio de rastreamento no seu navegador</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cookies de Terceiros</h2>
            <p className="mb-4">A plataforma utiliza os seguintes serviços de terceiros que podem definir cookies:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Google Analytics (GA4):</strong> Análise de uso da plataforma
                <ul className="list-circle pl-6 mt-2">
                  <li>Política de Privacidade: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a></li>
                  <li>Opt-out disponível conforme seção 4</li>
                </ul>
              </li>
              <li><strong>Supabase Auth:</strong> Autenticação e gerenciamento de sessões
                <ul className="list-circle pl-6 mt-2">
                  <li>Cookies essenciais para funcionamento da plataforma</li>
                  <li>Política de Privacidade: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Privacy</a></li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Duração dos Cookies</h2>
            <p className="mb-4">Utilizamos dois tipos de cookies:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Cookies de Sessão:</strong> Temporários, expiram quando você fecha o navegador (ex: sb-access-token)</li>
              <li><strong>Cookies Persistentes:</strong> Permanecem no dispositivo por um período definido (ex: sb-refresh-token por 30 dias, _ga por 2 anos)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Atualizações desta Política</h2>
            <p className="mb-4">Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou requisitos legais. A data de "Última atualização" no topo desta página indica quando a política foi revisada pela última vez.</p>
            <p className="mb-4">Mudanças significativas serão comunicadas por email ou notificação na plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Dúvidas sobre Cookies</h2>
            <p className="mb-4">Se você tiver perguntas sobre nossa utilização de cookies, entre em contato:</p>
            <p className="mb-2"><strong>Email:</strong> cookies@exames.app</p>
            <p className="mb-2"><strong>Privacidade Geral:</strong> privacidade@exames.app</p>
            <p>Consulte também nossa <a href="/privacy-policy" className="text-primary hover:underline">Política de Privacidade</a> para informações mais amplas sobre tratamento de dados.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
