import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { generateAcceptanceNotificationEmail } from "../send-invitation/_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const resend = new Resend(resendApiKey);

    const { invitationId } = await req.json();

    // Buscar convite aceito com dados do admin
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
      adminEmail: adminAuth.user.email,
      adminName: adminProfile?.full_name || "Administrador",
      professionalName: invitation.full_name || invitation.email,
      professionalEmail: invitation.email,
    });

    // Enviar email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Sistema Exames <onboarding@resend.dev>",
      to: [adminAuth.user.email],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailError) {
      throw emailError;
    }

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
