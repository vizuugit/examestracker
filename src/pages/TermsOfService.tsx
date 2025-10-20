
import Navbar from "@/components/Navbar";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="inline-block bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
            <p className="text-cyan-400 font-semibold text-sm flex items-center gap-2">
              <span>⚖️</span>
              Contrato Legal
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Termos de </span>
            <span className="text-cyan-400">Uso</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl">
            Acordo legal entre você e a plataforma Exames para uso dos nossos serviços.
          </p>
          <p className="text-sm text-gray-500 mb-12 pb-8 border-b border-gray-800">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              1. Aceitação dos Termos
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Ao acessar e utilizar a plataforma Exames, você concorda com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              2. Descrição do Serviço
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              A plataforma Exames é um software como serviço (SaaS) que oferece:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Upload e armazenamento seguro de documentos de exames médicos em PDF</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Processamento automatizado de laudos via AWS Textract</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Análise e estruturação de dados por inteligência artificial (Claude Vision)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Dashboard interativo de acompanhamento de pacientes</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Geração de gráficos de evolução e tabelas comparativas</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Exportação de relatórios em PDF</span>
              </li>
            </ul>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <p className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                IMPORTANTE
              </p>
              <p className="text-gray-300">
                A plataforma é uma ferramenta de apoio à decisão clínica e{" "}
                <strong className="text-white">NÃO substitui o julgamento médico profissional</strong>.
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              3. Elegibilidade e Cadastro
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Profissionais de saúde:</strong>
                  <span className="text-gray-300"> Apenas médicos, enfermeiros, nutricionistas e outros profissionais de saúde devidamente licenciados podem utilizar a plataforma</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Informações verdadeiras:</strong>
                  <span className="text-gray-300"> Você deve fornecer dados corretos e atualizados no cadastro</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Segurança de credenciais:</strong>
                  <span className="text-gray-300"> Você é responsável por manter suas credenciais de acesso em sigilo</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Consentimento dos pacientes:</strong>
                  <span className="text-gray-300"> É sua responsabilidade obter consentimento adequado dos pacientes para upload e processamento de seus exames</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              4. Responsabilidades do Usuário
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Ao utilizar a plataforma, você se compromete a:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Obter consentimento dos pacientes</strong>
                  <span className="text-gray-300"> antes de fazer upload de seus exames</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Não compartilhar credenciais</strong>
                  <span className="text-gray-300"> de acesso com terceiros</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Usar a plataforma exclusivamente para fins legais</strong>
                  <span className="text-gray-300"> e em conformidade com as regulamentações médicas vigentes</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Não tentar acessar</strong>
                  <span className="text-gray-300"> dados de outros usuários ou realizar engenharia reversa da plataforma</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Manter seus dados de cadastro atualizados</strong>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Reportar bugs:</strong>
                  <span className="text-gray-300"> comunicar falhas ou vulnerabilidades de segurança à nossa equipe</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              5. Responsabilidades da Plataforma
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Nos comprometemos a:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Processar exames com precisão razoável usando tecnologias de IA avançadas</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Manter a segurança e confidencialidade dos dados (criptografia, RLS, backups)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Disponibilidade do serviço de 99% (exceto durante manutenções programadas)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Notificá-lo sobre alterações importantes nos Termos ou na Política de Privacidade</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Fornecer suporte técnico adequado</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              6. Limitações de Responsabilidade
            </h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
              <p className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                AVISOS IMPORTANTES
              </p>
              <ul className="space-y-3">
                <li className="text-gray-300 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  <span>A inteligência artificial é uma <strong className="text-white">ferramenta de apoio</strong>, não substitui o julgamento clínico</span>
                </li>
                <li className="text-gray-300 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  <span>A plataforma pode apresentar erros na extração ou interpretação de dados</span>
                </li>
                <li className="text-gray-300 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  <span><strong className="text-white">Sempre revise</strong> os dados extraídos antes de tomar decisões clínicas</span>
                </li>
              </ul>
            </div>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Não nos responsabilizamos por:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Decisões médicas baseadas exclusivamente na plataforma</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Nossa responsabilidade é limitada ao valor pago pelo serviço nos últimos 12 meses</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Não garantimos que a plataforma será livre de erros ou interrupções</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              7. Propriedade Intelectual
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Seus dados:</strong>
                  <span className="text-gray-300"> Todos os dados de pacientes e exames pertencem a você</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <div>
                  <strong className="text-white font-semibold">Nossa plataforma:</strong>
                  <span className="text-gray-300"> O código, design, algoritmos de IA e marca pertencem à Exames</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Você pode exportar e compartilhar relatórios gerados pela plataforma</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Não pode copiar, modificar ou criar trabalhos derivados da plataforma</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              8. Modificações do Serviço
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Reservamos o direito de modificar, suspender ou descontinuar qualquer funcionalidade mediante aviso prévio de 30 dias. Melhorias e correções podem ser implementadas sem aviso.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              9. Planos e Pagamento
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Oferecemos planos mensais e anuais</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Os valores podem ser reajustados mediante aviso prévio de 30 dias</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Não há reembolso para cancelamentos no meio do período</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>O não pagamento resultará na suspensão da conta</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              10. Rescisão e Cancelamento
            </h2>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100">
              Por você:
            </h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Pode cancelar sua conta a qualquer momento nas configurações</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Seus dados serão mantidos por 30 dias para recuperação</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Após 30 dias, todos os dados serão permanentemente excluídos</span>
              </li>
            </ul>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100">
              Por nós:
            </h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Podemos suspender ou encerrar contas em caso de violação destes termos</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Uso indevido da plataforma ou atividades ilegais</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Notificaremos você antes da exclusão permanente de dados</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              11. Isenção de Garantias
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              A plataforma é fornecida "como está" e "conforme disponível". Não garantimos que:
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>O serviço será ininterrupto ou livre de erros</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Os resultados da IA serão sempre precisos</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 mt-1.5">•</span>
                <span>Defeitos serão corrigidos imediatamente</span>
              </li>
            </ul>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-400">
              12. Lei Aplicável e Foro
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo/SP, com exclusão de qualquer outro, por mais privilegiado que seja.
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <p className="text-white font-semibold mb-2">📧 Contato</p>
              <p className="text-gray-300">
                <a href="mailto:termos@exames.app" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">
                  termos@exames.app
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
