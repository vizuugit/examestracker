import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generateWelcomeEmail = (params: {
  professionalName: string;
  professionalEmail: string;
  specialty?: string;
}) => {
  const { professionalName, professionalEmail, specialty } = params;
  
  return {
    subject: `🎉 Bem-vindo(a) ao Exames.co, ${professionalName}!`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(33, 150, 243, 0.3);">
          <!-- Header com gradiente azul -->
          <tr>
            <td style="background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%); padding: 50px 40px; text-align: center;">
              <div style="font-size: 56px; margin-bottom: 20px;">🎉</div>
              <h1 style="color: white; margin: 0 0 10px; font-size: 32px; font-weight: 700;">Bem-vindo(a) ao Exames.co!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Sua jornada na automação de exames começa agora</p>
            </td>
          </tr>
          
          <!-- Conteúdo principal -->
          <tr>
            <td style="padding: 40px; color: #e0e0e0;">
              <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong style="color: white;">${professionalName}</strong>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #b0b0b0;">
                É com grande satisfação que damos as boas-vindas à plataforma <strong style="color: #2196F3;">Exames.co</strong>! 
                Você agora faz parte de uma comunidade de profissionais de saúde que está revolucionando a forma de acompanhar exames de pacientes.
              </p>

              ${specialty ? `
              <div style="background-color: rgba(33, 150, 243, 0.1); border-left: 4px solid #2196F3; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: white;">
                  <strong>🏥 Especialidade:</strong> ${specialty}
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #b0b0b0;">
                  📧 ${professionalEmail}
                </p>
              </div>
              ` : `
              <div style="background-color: rgba(33, 150, 243, 0.1); border-left: 4px solid #2196F3; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: white;">
                  📧 ${professionalEmail}
                </p>
              </div>
              `}

              <!-- Próximos passos -->
              <h2 style="color: white; font-size: 22px; margin: 32px 0 20px; font-weight: 600;">🚀 Próximos Passos</h2>
              
              <div style="margin-bottom: 16px;">
                <div style="background-color: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <div style="color: #2196F3; font-size: 20px; font-weight: bold; margin-bottom: 8px;">1️⃣ Cadastre seus pacientes</div>
                  <p style="margin: 0; color: #b0b0b0; font-size: 14px;">Crie perfis para seus pacientes e organize todos os dados em um único lugar.</p>
                </div>
                
                <div style="background-color: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <div style="color: #2196F3; font-size: 20px; font-weight: bold; margin-bottom: 8px;">2️⃣ Faça upload de laudos</div>
                  <p style="margin: 0; color: #b0b0b0; font-size: 14px;">Nossa IA extrai automaticamente todos os dados dos PDFs de exames.</p>
                </div>
                
                <div style="background-color: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <div style="color: #2196F3; font-size: 20px; font-weight: bold; margin-bottom: 8px;">3️⃣ Acompanhe a evolução</div>
                  <p style="margin: 0; color: #b0b0b0; font-size: 14px;">Visualize gráficos e tabelas com a evolução dos biomarcadores ao longo do tempo.</p>
                </div>
                
                <div style="background-color: #1a1a1a; border-radius: 8px; padding: 16px;">
                  <div style="color: #2196F3; font-size: 20px; font-weight: bold; margin-bottom: 8px;">4️⃣ Exporte relatórios</div>
                  <p style="margin: 0; color: #b0b0b0; font-size: 14px;">Gere PDFs profissionais para compartilhar com seus pacientes.</p>
                </div>
              </div>

              <!-- Dicas rápidas -->
              <div style="background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(66, 165, 245, 0.05) 100%); border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="color: #2196F3; margin: 0 0 16px; font-size: 18px; font-weight: 600;">💡 Dica Profissional</h3>
                <p style="margin: 0; color: #e0e0e0; font-size: 14px; line-height: 1.6;">
                  A plataforma funciona melhor quando você mantém um histórico completo de exames. 
                  Quanto mais dados, mais precisas serão as análises de tendência e evolução!
                </p>
              </div>

              <!-- Call to action -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
                  🏥 Acessar Dashboard
                </a>
              </div>

              <p style="font-size: 14px; color: #808080; margin: 32px 0 0; line-height: 1.6;">
                Se tiver qualquer dúvida ou precisar de ajuda, nossa equipe está à disposição. 
                Desejamos muito sucesso na utilização da plataforma!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 32px; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666;">
                <strong style="color: #2196F3;">Exames.co</strong> - Automação Inteligente de Exames
              </p>
              <p style="margin: 0; font-size: 12px; color: #444;">
                © ${new Date().getFullYear()} Exames.co. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
🎉 Bem-vindo(a) ao Exames.co, ${professionalName}!

Olá ${professionalName},

É com grande satisfação que damos as boas-vindas à plataforma Exames.co!
Você agora faz parte de uma comunidade de profissionais de saúde que está revolucionando a forma de acompanhar exames de pacientes.

${specialty ? `Especialidade: ${specialty}` : ''}
Email: ${professionalEmail}

🚀 PRÓXIMOS PASSOS:

1️⃣ Cadastre seus pacientes
   Crie perfis para seus pacientes e organize todos os dados em um único lugar.

2️⃣ Faça upload de laudos
   Nossa IA extrai automaticamente todos os dados dos PDFs de exames.

3️⃣ Acompanhe a evolução
   Visualize gráficos e tabelas com a evolução dos biomarcadores ao longo do tempo.

4️⃣ Exporte relatórios
   Gere PDFs profissionais para compartilhar com seus pacientes.

💡 DICA PROFISSIONAL:
A plataforma funciona melhor quando você mantém um histórico completo de exames. 
Quanto mais dados, mais precisas serão as análises de tendência e evolução!

Acesse seu dashboard em: ${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard

Se tiver qualquer dúvida ou precisar de ajuda, nossa equipe está à disposição.
Desejamos muito sucesso na utilização da plataforma!

---
Exames.co - Automação Inteligente de Exames
© ${new Date().getFullYear()} Exames.co. Todos os direitos reservados.
    `.trim()
  };
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY não configurada");
      return new Response(
        JSON.stringify({ warning: "Email não configurado" }), 
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { professionalName, professionalEmail, specialty } = await req.json();

    console.log(`📧 Enviando email de boas-vindas para ${professionalEmail}...`);

    const emailContent = generateWelcomeEmail({
      professionalName,
      professionalEmail,
      specialty,
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Exames.co Boas-vindas <boas-vindas@exames.co>",
        to: [professionalEmail],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("❌ Erro ao enviar email:", errorData);
      throw new Error(`Falha no envio: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();

    console.log("✅ Email de boas-vindas enviado com sucesso:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de boas-vindas enviado",
        emailId: emailData?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro ao enviar email de boas-vindas:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
