
import Navbar from "@/components/Navbar";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">Ao acessar e utilizar a plataforma Exames, você concorda com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não utilize nossos serviços.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="mb-4">A plataforma Exames é um software como serviço (SaaS) que oferece:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Upload e armazenamento seguro de documentos de exames médicos em PDF</li>
              <li>Processamento automatizado de laudos via AWS Textract</li>
              <li>Análise e estruturação de dados por inteligência artificial (Claude Vision)</li>
              <li>Dashboard interativo de acompanhamento de pacientes</li>
              <li>Geração de gráficos de evolução e tabelas comparativas</li>
              <li>Exportação de relatórios em PDF</li>
            </ul>
            <p className="mb-4"><strong>IMPORTANTE:</strong> A plataforma é uma ferramenta de apoio à decisão clínica e <strong>NÃO substitui o julgamento médico profissional</strong>.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Elegibilidade e Cadastro</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-200 space-y-2">
            <li><strong className="text-white">Profissionais de saúde:</strong> Apenas médicos, enfermeiros, nutricionistas e outros profissionais de saúde devidamente licenciados podem utilizar a plataforma</li>
            <li><strong className="text-white">Informações verdadeiras:</strong> Você deve fornecer dados corretos e atualizados no cadastro</li>
            <li><strong className="text-white">Segurança de credenciais:</strong> Você é responsável por manter suas credenciais de acesso em sigilo</li>
            <li><strong className="text-white">Consentimento dos pacientes:</strong> É sua responsabilidade obter consentimento adequado dos pacientes para upload e processamento de seus exames</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">4. Responsabilidades do Usuário</h2>
            <p className="mb-4">Ao utilizar a plataforma, você se compromete a:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Obter consentimento dos pacientes</strong> antes de fazer upload de seus exames</li>
              <li>Garantir que todos os dados inseridos são verdadeiros e precisos</li>
              <li>Usar a plataforma apenas para fins legítimos e profissionais</li>
              <li>Não compartilhar credenciais de acesso com terceiros</li>
              <li>Manter a confidencialidade dos dados dos pacientes</li>
              <li>Não usar a plataforma como substituto de diagnóstico médico profissional</li>
              <li>Cumprir todas as leis e regulamentos aplicáveis (CFM, LGPD, etc.)</li>
              <li>Não tentar acessar dados de outros profissionais ou pacientes não autorizados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Responsabilidades da Plataforma</h2>
            <p className="mb-4">Nos comprometemos a:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Processar exames com precisão razoável usando tecnologias de IA avançadas</li>
              <li>Manter a segurança e confidencialidade dos dados (criptografia, RLS, backups)</li>
              <li>Disponibilidade do serviço de 99% (exceto durante manutenções programadas)</li>
              <li>Notificá-lo sobre alterações importantes nos Termos ou na Política de Privacidade</li>
              <li>Fornecer suporte técnico adequado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitações de Responsabilidade</h2>
            <p className="mb-4 font-bold text-yellow-400">⚠️ AVISOS IMPORTANTES:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>A inteligência artificial é uma <strong>ferramenta de apoio</strong>, não substitui o julgamento clínico</li>
              <li>A plataforma pode apresentar erros na extração ou interpretação de dados</li>
              <li><strong>Sempre revise</strong> os dados extraídos antes de tomar decisões clínicas</li>
              <li>Não nos responsabilizamos por decisões médicas baseadas exclusivamente na plataforma</li>
              <li>Nossa responsabilidade é limitada ao valor pago pelo serviço nos últimos 12 meses</li>
              <li>Não garantimos que a plataforma será livre de erros ou interrupções</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Propriedade Intelectual</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Seus dados:</strong> Todos os dados de pacientes e exames pertencem a você</li>
              <li><strong>Nossa plataforma:</strong> O código, design, algoritmos de IA e marca pertencem à Exames</li>
              <li>Você pode exportar e compartilhar relatórios gerados pela plataforma</li>
              <li>Não pode copiar, modificar ou criar trabalhos derivados da plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Modificações do Serviço</h2>
            <p className="mb-4">Reservamos o direito de modificar, suspender ou descontinuar qualquer funcionalidade mediante aviso prévio de 30 dias. Melhorias e correções podem ser implementadas sem aviso.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Planos e Pagamento</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Oferecemos planos mensais e anuais</li>
              <li>Os valores podem ser reajustados mediante aviso prévio de 30 dias</li>
              <li>Não há reembolso para cancelamentos no meio do período</li>
              <li>O não pagamento resultará na suspensão da conta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Rescisão e Cancelamento</h2>
            <p className="mb-4"><strong>Por você:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Pode cancelar sua conta a qualquer momento nas configurações</li>
              <li>Seus dados serão mantidos por 30 dias para recuperação</li>
              <li>Após 30 dias, todos os dados serão permanentemente excluídos</li>
            </ul>
            <p className="mb-4"><strong>Por nós:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Podemos suspender ou encerrar contas em caso de violação destes termos</li>
              <li>Uso indevido da plataforma ou atividades ilegais</li>
              <li>Notificaremos você antes da exclusão permanente de dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Isenção de Garantias</h2>
            <p className="mb-4">A plataforma é fornecida "como está" e "conforme disponível". Não garantimos que:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>O serviço será ininterrupto ou livre de erros</li>
              <li>Os resultados da IA serão sempre precisos</li>
              <li>Defeitos serão corrigidos imediatamente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Lei Aplicável e Foro</h2>
            <p className="mb-4">Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo/SP, com exclusão de qualquer outro, por mais privilegiado que seja.</p>
            <p className="mb-4"><strong>Contato:</strong> termos@exames.app</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
