import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateInvitationEmail } from "./_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invitationId }: InvitationRequest = await req.json();

    console.log("🔍 Processando convite:", invitationId);

    // Buscar dados do convite
    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (inviteError || !invitation) {
      console.error("❌ Convite não encontrado:", inviteError);
      throw new Error("Convite não encontrado");
    }

    // Buscar dados do admin
    const { data: admin } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invitation.invited_by)
      .single();

    const adminName = admin?.full_name || "Administrador";

    // Gerar link de convite
    const appUrl = 'https://exames.co';
    const inviteLink = `${appUrl}/accept-invite?token=${invitation.token}`;

    // Gerar template de email
    const emailContent = generateInvitationEmail({
      recipientEmail: invitation.email,
      inviteLink,
      adminName,
      expiresAt: invitation.expires_at,
    });

    // Enviar email via Resend API
    console.log(`📧 Enviando email para ${invitation.email}...`);
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Exames.co Convites <convites@exames.co>",
        to: [invitation.email],
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

    console.log("✅ Email enviado com sucesso:", emailData);

    // Atualizar contador de reenvios
    await supabase
      .from("invitations")
      .update({
        resent_count: (invitation.resent_count || 0) + 1,
        last_resent_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso",
        emailId: emailData?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro ao processar convite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
