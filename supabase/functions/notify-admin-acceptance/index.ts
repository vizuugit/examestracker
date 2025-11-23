import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inline email template para evitar problemas de import entre funções
const generateAcceptanceNotificationEmail = (params: {
  adminName: string;
  professionalName: string;
  professionalEmail: string;
}) => {
  const { adminName, professionalName, professionalEmail } = params;
  
  return {
    subject: `${professionalName} aceitou seu convite no Exames.co`,
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
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(76, 175, 80, 0.2);">
          <tr>
            <td style="background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Convite Aceito!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; color: #e0e0e0;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Olá <strong style="color: white;">${adminName}</strong>,
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Boas notícias! O profissional que você convidou aceitou e criou sua conta no Exames.co.
              </p>
              <div style="background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; font-size: 16px; color: white;">
                  <strong>👤 ${professionalName}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #b0b0b0;">
                  📧 ${professionalEmail}
                </p>
              </div>
              <p style="font-size: 14px; color: #808080; margin: 24px 0 0;">
                O novo usuário já pode acessar o sistema e começar a utilizar todas as funcionalidades.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0a0a0a; padding: 32px; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0; font-size: 12px; color: #444;">
                © ${new Date().getFullYear()} Exames.co
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
Convite Aceito!

Olá ${adminName},

Boas notícias! O profissional que você convidou aceitou e criou sua conta no Exames.co.

Informações:
- Nome: ${professionalName}
- Email: ${professionalEmail}

O novo usuário já pode acessar o sistema e começar a utilizar todas as funcionalidades.

---
Exames.co
    `.trim()
  };
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY não configurada - notificação não será enviada");
      return new Response(JSON.stringify({ warning: "Email não configurado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invitationId } = await req.json();

    // Buscar convite aceito
    const { data: invitation } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("status", "accepted")
      .single();

    if (!invitation) {
      return new Response(JSON.stringify({ error: "Convite não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar perfil do admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invitation.invited_by)
      .single();

    // Buscar email do admin via Auth
    const { data: adminAuth } = await supabase.auth.admin.getUserById(
      invitation.invited_by
    );

    if (!adminAuth.user?.email) {
      throw new Error("Email do admin não encontrado");
    }

    const emailContent = generateAcceptanceNotificationEmail({
      adminName: adminProfile?.full_name || "Administrador",
      professionalName: invitation.full_name || invitation.email,
      professionalEmail: invitation.email,
    });

    // Enviar email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Exames.co Notificações <notificacoes@exames.co>",
        to: [adminAuth.user.email],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();

    console.log("✅ Notificação de aceite enviada ao admin");

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro ao notificar admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
