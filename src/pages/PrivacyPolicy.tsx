
import Navbar from "@/components/Navbar";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-white">Política de Privacidade</h1>
        <div className="max-w-4xl">
          <p className="mb-6 text-gray-300">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Informações que Coletamos</h2>
            <p className="mb-4 text-gray-200">Como plataforma SaaS de gestão de exames médicos, coletamos e processamos dados sensíveis de saúde. As informações incluem:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-200 space-y-2">
              <li><strong className="text-white">Dados de Profissionais de Saúde:</strong> Nome, email, telefone, especialidade, registro profissional</li>
              <li><strong className="text-white">Dados de Pacientes:</strong> Nome, CPF, data de nascimento, contatos, histórico médico, condições de saúde</li>
              <li><strong className="text-white">Arquivos de Exames:</strong> PDFs, imagens e documentos médicos enviados pelos profissionais</li>
              <li><strong className="text-white">Dados Extraídos:</strong> Biomarcadores, valores de exames, categorias clínicas processados por IA</li>
              <li><strong className="text-white">Dados de Uso:</strong> Logs de acesso, métricas de uso via Google Analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Como Coletamos os Dados</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Upload direto de arquivos PDF pelo profissional de saúde</li>
              <li>Formulários de cadastro de pacientes e profissionais</li>
              <li>Extração automática de dados via AWS Textract</li>
              <li>Análise e estruturação via inteligência artificial (Claude Vision)</li>
              <li>Cookies e tecnologias de rastreamento (ver Política de Cookies)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Como Usamos Seus Dados</h2>
            <p className="mb-4">Utilizamos os dados coletados para:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Processar e analisar exames médicos com inteligência artificial</li>
              <li>Gerar relatórios, gráficos de evolução e tabelas comparativas</li>
              <li>Realizar matching automático de pacientes</li>
              <li>Armazenar de forma segura na AWS S3</li>
              <li>Fornecer insights clínicos e apoio à decisão médica</li>
              <li>Melhorar a precisão dos algoritmos de IA</li>
              <li>Análise de métricas de uso para melhorar a plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Compartilhamento de Dados</h2>
            <p className="mb-4 text-gray-200"><strong className="text-white">NÃO vendemos dados de pacientes.</strong> Compartilhamos dados apenas com:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-200 space-y-2">
              <li><strong className="text-white">AWS (Amazon Web Services):</strong> Armazenamento (S3) e processamento de documentos (Textract) - servidores nos EUA</li>
              <li><strong className="text-white">Anthropic (Claude AI):</strong> Análise e estruturação de dados de exames via IA</li>
              <li><strong className="text-white">Google Analytics:</strong> Métricas anonimizadas de uso da plataforma</li>
              <li><strong className="text-white">Provedores de Infraestrutura:</strong> Hospedagem e banco de dados (Supabase)</li>
              <li><strong className="text-white">Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="mb-4 text-gray-200">Todos os prestadores de serviço assinam acordos de confidencialidade e proteção de dados.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Segurança e Proteção</h2>
            <p className="mb-4">Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Criptografia em trânsito (HTTPS/TLS)</li>
              <li>Armazenamento seguro com criptografia na AWS S3</li>
              <li>Autenticação robusta via Supabase Auth</li>
              <li>Row Level Security (RLS) - cada profissional acessa apenas seus próprios dados</li>
              <li>Logs de auditoria e monitoramento de acessos</li>
              <li>Backups regulares e redundância de dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="mb-4">Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Acesso:</strong> Solicitar cópia de todos os dados que mantemos sobre você</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão de dados (direito ao esquecimento)</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e legível</li>
              <li><strong>Revogação de Consentimento:</strong> Retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Se opor ao tratamento de dados em certas situações</li>
            </ul>
            <p className="mb-4">Para exercer esses direitos, entre em contato com nosso DPO (Encarregado de Dados): <strong>privacidade@exames.app</strong></p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Retenção de Dados</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-200 space-y-2">
              <li><strong className="text-white">Dados de Exames:</strong> Mantidos enquanto a conta do profissional estiver ativa</li>
              <li><strong className="text-white">Dados de Pacientes:</strong> Mantidos conforme solicitação do profissional de saúde</li>
              <li><strong className="text-white">Logs de Acesso:</strong> Mantidos por até 12 meses para fins de segurança</li>
              <li><strong className="text-white">Exclusão de Conta:</strong> Todos os dados serão removidos em até 30 dias após solicitação</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Cookies e Tecnologias de Rastreamento</h2>
            <p className="mb-4 text-gray-200">Utilizamos cookies para autenticação e análise de uso. Consulte nossa <a href="/cookie-policy" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">Política de Cookies</a> para mais detalhes.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Transferência Internacional de Dados</h2>
            <p className="mb-4 text-gray-200">Seus dados podem ser processados em servidores localizados nos Estados Unidos (AWS). Garantimos que essas transferências estão em conformidade com a LGPD e utilizam cláusulas contratuais padrão aprovadas.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Base Legal para Tratamento</h2>
            <p className="mb-4 text-gray-200">Processamos dados de saúde com base nas seguintes hipóteses legais da LGPD:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-200 space-y-2">
              <li>Consentimento do profissional de saúde (que obtém consentimento do paciente)</li>
              <li>Execução de contrato de prestação de serviços</li>
              <li>Cumprimento de obrigação legal ou regulatória</li>
              <li>Proteção da vida ou da incolumidade física</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Menores de Idade</h2>
            <p className="mb-4 text-gray-200">A plataforma é destinada exclusivamente a profissionais de saúde maiores de 18 anos. Dados de pacientes menores de idade devem ser inseridos apenas com consentimento dos responsáveis legais.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">12. Contato e DPO</h2>
            <p className="mb-4 text-gray-200">Para questões sobre privacidade e proteção de dados, entre em contato:</p>
            <p className="mb-2 text-gray-200"><strong className="text-white">Email do DPO:</strong> privacidade@exames.app</p>
            <p className="mb-2 text-gray-200"><strong className="text-white">Email Geral:</strong> contato@exames.app</p>
            <p className="text-gray-200">Respondemos todas as solicitações em até 15 dias úteis.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
