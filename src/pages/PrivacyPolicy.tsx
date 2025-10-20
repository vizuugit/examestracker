
import Navbar from "@/components/Navbar";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Política de </span>
            <span className="text-cyan-400">Privacidade</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl">
            Transparência e proteção dos seus dados médicos em primeiro lugar.
          </p>
          <p className="text-sm text-gray-500 mb-12 pb-8 border-b border-gray-800">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
          
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              1. Informações que Coletamos
            </h2>
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-6 mb-6">
              <p className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                Dados Sensíveis de Saúde
              </p>
              <p className="text-gray-300">
                Como plataforma SaaS de gestão de exames médicos, coletamos e processamos dados sensíveis de saúde com máxima segurança e conformidade com a LGPD.
              </p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Dados de Profissionais de Saúde:</strong>
                  <span className="text-gray-300"> Nome, email, telefone, especialidade, registro profissional</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Dados de Pacientes:</strong>
                  <span className="text-gray-300"> Nome, CPF, data de nascimento, contatos, histórico médico, condições de saúde</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Arquivos de Exames:</strong>
                  <span className="text-gray-300"> PDFs, imagens e documentos médicos enviados pelos profissionais</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Dados Extraídos:</strong>
                  <span className="text-gray-300"> Biomarcadores, valores de exames, categorias clínicas processados por IA</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Dados de Uso:</strong>
                  <span className="text-gray-300"> Logs de acesso, métricas de uso via Google Analytics</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              2. Como Coletamos os Dados
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Upload direto de arquivos PDF pelo profissional de saúde</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Formulários de cadastro de pacientes e profissionais</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Extração automática de dados via AWS Textract</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Análise e estruturação via inteligência artificial (Claude Vision)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <span>Cookies e tecnologias de rastreamento (ver </span>
                  <a href="/cookie-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                    Política de Cookies
                  </a>
                  <span>)</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              3. Como Usamos Seus Dados
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Utilizamos os dados coletados para:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Processar e exibir resultados de exames médicos através de nossos serviços de IA</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Gerar gráficos de evolução e relatórios comparativos de biomarcadores</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Melhorar a precisão e funcionalidade da plataforma</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Fornecer suporte técnico e atendimento ao cliente</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Cumprir obrigações legais e regulatórias do setor de saúde</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              4. Compartilhamento de Dados
            </h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
              <p className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                NÃO VENDEMOS DADOS DE PACIENTES
              </p>
              <p className="text-gray-300">
                Seus dados médicos nunca serão comercializados. Compartilhamos apenas com prestadores essenciais ao funcionamento da plataforma.
              </p>
            </div>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Compartilhamos dados apenas com:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">AWS (Amazon Web Services):</strong>
                  <span className="text-gray-300"> Armazenamento (S3) e processamento de documentos (Textract) - servidores nos EUA</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Anthropic (Claude AI):</strong>
                  <span className="text-gray-300"> Análise e estruturação de dados de exames via IA</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Google Analytics:</strong>
                  <span className="text-gray-300"> Métricas anonimizadas de uso da plataforma</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Provedores de Infraestrutura:</strong>
                  <span className="text-gray-300"> Hospedagem e banco de dados (Supabase)</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Autoridades:</strong>
                  <span className="text-gray-300"> Quando exigido por lei ou ordem judicial</span>
                </div>
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Todos os prestadores de serviço assinam acordos de confidencialidade e proteção de dados.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              5. Segurança e Proteção
            </h2>
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-6 mb-6">
              <p className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Segurança de Dados Médicos
              </p>
              <p className="text-gray-300">
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Criptografia em trânsito (HTTPS/TLS)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Armazenamento seguro com criptografia na AWS S3</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Autenticação robusta via Supabase Auth</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Row Level Security (RLS) - cada profissional acessa apenas seus próprios dados</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Logs de auditoria e monitoramento de acessos</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Backups regulares e redundância de dados</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              6. Seus Direitos (LGPD)
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Acesso:</strong>
                  <span className="text-gray-300"> Solicitar cópia de todos os dados que mantemos sobre você</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Correção:</strong>
                  <span className="text-gray-300"> Corrigir dados incompletos, inexatos ou desatualizados</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Exclusão:</strong>
                  <span className="text-gray-300"> Solicitar a exclusão de dados (direito ao esquecimento)</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Portabilidade:</strong>
                  <span className="text-gray-300"> Receber seus dados em formato estruturado e legível</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Revogação de Consentimento:</strong>
                  <span className="text-gray-300"> Retirar consentimento a qualquer momento</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Oposição:</strong>
                  <span className="text-gray-300"> Se opor ao tratamento de dados em certas situações</span>
                </div>
              </li>
            </ul>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <p className="text-white font-semibold mb-2 flex items-center gap-2">
                <span>📧</span>
                Contato do DPO (Encarregado de Dados)
              </p>
              <p className="text-gray-300">
                Para exercer esses direitos, entre em contato:{" "}
                <a href="mailto:privacidade@exames.app" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  privacidade@exames.app
                </a>
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              7. Retenção de Dados
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Dados de Exames:</strong>
                  <span className="text-gray-300"> Mantidos enquanto a conta do profissional estiver ativa</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Dados de Pacientes:</strong>
                  <span className="text-gray-300"> Mantidos conforme solicitação do profissional de saúde</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Logs de Acesso:</strong>
                  <span className="text-gray-300"> Mantidos por até 12 meses para fins de segurança</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Exclusão de Conta:</strong>
                  <span className="text-gray-300"> Todos os dados serão removidos em até 30 dias após solicitação</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              8. Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Utilizamos cookies para autenticação e análise de uso. Consulte nossa{" "}
              <a href="/cookie-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                Política de Cookies
              </a>{" "}
              para mais detalhes.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              9. Transferência Internacional de Dados
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Seus dados podem ser processados em servidores localizados nos Estados Unidos (AWS). Garantimos que essas transferências estão em conformidade com a LGPD e utilizam cláusulas contratuais padrão aprovadas.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              10. Base Legal para Tratamento
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Processamos dados de saúde com base nas seguintes hipóteses legais da LGPD:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Consentimento do profissional de saúde (que obtém consentimento do paciente)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Execução de contrato de prestação de serviços</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Cumprimento de obrigação legal ou regulatória</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Proteção da vida ou da incolumidade física</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              11. Menores de Idade
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              A plataforma é destinada exclusivamente a profissionais de saúde maiores de 18 anos. Dados de pacientes menores de idade devem ser inseridos apenas com consentimento dos responsáveis legais.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              12. Contato e DPO
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Para questões sobre privacidade e proteção de dados, entre em contato:
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-3">
              <p className="text-gray-300">
                <strong className="text-white font-semibold">Email do DPO:</strong>{" "}
                <a href="mailto:privacidade@exames.app" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  privacidade@exames.app
                </a>
              </p>
              <p className="text-gray-300">
                <strong className="text-white font-semibold">Email Geral:</strong>{" "}
                <a href="mailto:contato@exames.app" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  contato@exames.app
                </a>
              </p>
              <p className="text-gray-300 pt-2 border-t border-gray-700">
                Respondemos todas as solicitações em até 15 dias úteis.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
