import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuração: Pacientes sem exames há mais de X meses serão arquivados
const INACTIVITY_MONTHS = 6;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 Buscando pacientes inativos (sem exames há ${INACTIVITY_MONTHS} meses)...`);

    // Calcular data limite (X meses atrás)
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - INACTIVITY_MONTHS);
    const limitDateStr = limitDate.toISOString().split('T')[0];

    console.log(`📅 Data limite: ${limitDateStr}`);

    // Buscar todos os pacientes ativos
    const { data: activePatients, error: patientsError } = await supabase
      .from("patients")
      .select("id, full_name, professional_id")
      .eq("archived", false);

    if (patientsError) throw patientsError;

    console.log(`👥 Total de pacientes ativos: ${activePatients?.length || 0}`);

    const archivedPatients: Array<{
      patientId: string;
      patientName: string;
      professionalId: string;
    }> = [];

    // Para cada paciente, verificar se tem exames recentes
    for (const patient of activePatients || []) {
      const { data: recentExams, error: examsError } = await supabase
        .from("exams")
        .select("id")
        .eq("patient_id", patient.id)
        .gte("exam_date", limitDateStr)
        .limit(1);

      if (examsError) {
        console.error(`❌ Erro ao buscar exames do paciente ${patient.id}:`, examsError);
        continue;
      }

      // Se não tem exames recentes, arquivar
      if (!recentExams || recentExams.length === 0) {
        console.log(`📦 Arquivando paciente inativo: ${patient.full_name} (ID: ${patient.id})`);

        const { error: archiveError } = await supabase
          .from("patients")
          .update({
            archived: true,
            archived_at: new Date().toISOString(),
            archived_by: null, // Arquivamento automático
          })
          .eq("id", patient.id);

        if (archiveError) {
          console.error(`❌ Erro ao arquivar paciente ${patient.id}:`, archiveError);
          continue;
        }

        archivedPatients.push({
          patientId: patient.id,
          patientName: patient.full_name,
          professionalId: patient.professional_id,
        });
      }
    }

    console.log(`✅ Total de pacientes arquivados: ${archivedPatients.length}`);

    // Agrupar pacientes por profissional para enviar um email consolidado
    const patientsByProfessional = archivedPatients.reduce((acc, item) => {
      if (!acc[item.professionalId]) {
        acc[item.professionalId] = [];
      }
      acc[item.professionalId].push(item);
      return acc;
    }, {} as Record<string, typeof archivedPatients>);

    // Enviar notificações por email
    for (const [professionalId, patients] of Object.entries(patientsByProfessional)) {
      // Buscar dados do profissional
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", professionalId)
        .single();

      if (profileError || !profile) {
        console.error(`❌ Erro ao buscar perfil do profissional ${professionalId}:`, profileError);
        continue;
      }

      // Buscar email do profissional
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        professionalId
      );

      if (userError || !userData?.user?.email) {
        console.error(`❌ Erro ao buscar email do profissional ${professionalId}:`, userError);
        continue;
      }

      const professionalEmail = userData.user.email;
      const professionalName = profile.full_name;

      // Criar lista de pacientes para o email
      const patientsList = patients
        .map((p) => `• ${p.patientName}`)
        .join("\n");

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "HealthTrack <onboarding@resend.dev>",
            to: [professionalEmail],
            subject: `${patients.length} paciente(s) arquivado(s) automaticamente`,
            html: `
              <h2>Olá, ${professionalName}!</h2>
              <p>O sistema arquivou automaticamente <strong>${patients.length} paciente(s)</strong> que não possuem exames há mais de ${INACTIVITY_MONTHS} meses:</p>
              <pre>${patientsList}</pre>
              <p>Esses pacientes foram arquivados para manter sua lista organizada. Você pode restaurá-los a qualquer momento acessando a seção "Pacientes Arquivados" na plataforma.</p>
              <p><strong>Motivo:</strong> Inatividade de ${INACTIVITY_MONTHS} meses sem novos exames.</p>
              <br>
              <p>Atenciosamente,<br>Equipe HealthTrack</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
        }

        console.log(`✉️ Email enviado para ${professionalEmail}`);
      } catch (emailError) {
        console.error(`❌ Erro ao enviar email para ${professionalEmail}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        archivedCount: archivedPatients.length,
        notifiedProfessionals: Object.keys(patientsByProfessional).length,
        details: archivedPatients,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro no arquivamento automático:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
