import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'user_correction' | 'missing_biomarker' | 'rejected_biomarker';
  userId: string;
  examId: string;
  relatedId: string;
  biomarkerName?: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();
    console.log('[notify-admin-correction] Recebendo notificação:', payload.type);

    // Buscar todos os admins
    const { data: admins, error: adminsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminsError) {
      throw new Error(`Erro ao buscar admins: ${adminsError.message}`);
    }

    if (!admins || admins.length === 0) {
      console.log('[notify-admin-correction] Nenhum admin encontrado');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum admin para notificar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar notificação baseada no tipo
    let title = '';
    let message = '';
    let notificationData: any = {
      type: payload.type,
      metadata: {
        exam_id: payload.examId,
        user_id: payload.userId,
        ...payload.metadata,
      },
    };

    switch (payload.type) {
      case 'user_correction':
        title = `Nova correção: ${payload.biomarkerName || payload.fieldChanged}`;
        message = `Usuário corrigiu "${payload.fieldChanged}" de "${payload.oldValue}" para "${payload.newValue}"`;
        notificationData.related_correction_id = payload.relatedId;
        break;
      
      case 'missing_biomarker':
        title = `Biomarcador ausente adicionado: ${payload.biomarkerName}`;
        message = `Usuário adicionou biomarcador "${payload.biomarkerName}" que não foi detectado pelo sistema`;
        notificationData.related_missing_biomarker_id = payload.relatedId;
        break;
      
      case 'rejected_biomarker':
        title = `Biomarcador rejeitado: ${payload.biomarkerName}`;
        message = `Sistema rejeitou biomarcador "${payload.biomarkerName}" - revisar para possível adição ao spec`;
        notificationData.related_rejected_biomarker_id = payload.relatedId;
        break;
    }

    // Criar notificação para cada admin
    const notifications = admins.map(admin => ({
      admin_id: admin.user_id,
      ...notificationData,
      title,
      message,
    }));

    const { error: insertError } = await supabase
      .from('admin_notifications')
      .insert(notifications);

    if (insertError) {
      throw new Error(`Erro ao criar notificações: ${insertError.message}`);
    }

    console.log(`[notify-admin-correction] ${notifications.length} notificações criadas`);

    return new Response(
      JSON.stringify({ success: true, count: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[notify-admin-correction] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});