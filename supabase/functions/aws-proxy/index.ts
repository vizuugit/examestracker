import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const AWS_API_URL = "https://55oeqt4sk2.execute-api.us-east-1.amazonaws.com/prod/exam-url";

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');

    // ============================================
    // GET: Fetch correction stats
    // ============================================
    if (req.method === 'GET' && action === 'getCorrectionStats' && userId) {
      console.log('[AWS Proxy] Fetching correction stats for userId:', userId);

      // Verificar se o usuário é admin
      const { data: userRoles, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError || !userRoles || !userRoles.some(r => r.role === 'admin')) {
        console.log('[AWS Proxy] Access denied: User is not admin');
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const response = await fetch(AWS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getCorrectionStats',
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AWS Proxy] GET correction stats error:', response.status, errorText);
        throw new Error(`AWS Lambda error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AWS Proxy] Correction stats response:', JSON.stringify(data).substring(0, 500));
      
      let responseBody = data;
      if (data.body && typeof data.body === 'string') {
        try {
          responseBody = JSON.parse(data.body);
          console.log('[AWS Proxy] ✅ Stats body parsed:', responseBody);
        } catch (e) {
          console.error('[AWS Proxy] ❌ Failed to parse stats body:', e);
        }
      } else if (data.body && typeof data.body === 'object') {
        responseBody = data.body;
      }
      
      return new Response(JSON.stringify(responseBody), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // GET: Fetch exam status
    // ============================================
    if (req.method === 'GET' && userId && !action) {
      const url = new URL(req.url);
      const s3Key = url.searchParams.get('s3Key');
      
      console.log('[AWS Proxy] GET request for userId:', userId, 's3Key:', s3Key);
      
      const response = await fetch(AWS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getExamStatus',
          userId: userId,
          s3Key: s3Key,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AWS Proxy] GET (POST) error:', response.status, errorText);
        throw new Error(`AWS Lambda error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AWS Proxy] GET (POST) raw response:', JSON.stringify(data).substring(0, 500));
      
      // Se a Lambda retornou um body como string, fazer parse
      let responseBody = data;
      if (data.body && typeof data.body === 'string') {
        try {
          responseBody = JSON.parse(data.body);
          console.log('[AWS Proxy] ✅ Body parsed - status:', responseBody.status);
        } catch (e) {
          console.error('[AWS Proxy] ❌ Failed to parse Lambda body:', e);
        }
      } else if (data.body && typeof data.body === 'object') {
        // Se body já é objeto, usar direto
        responseBody = data.body;
        console.log('[AWS Proxy] ✅ Body já é objeto - status:', responseBody.status);
      }
      
      // VALIDAÇÃO: Garantir que tem a estrutura esperada
      if (responseBody && responseBody.status === 'completed') {
        if (!responseBody.data || !responseBody.data.dados_basicos) {
          console.error('[AWS Proxy] ⚠️ Estrutura incompleta:', JSON.stringify(responseBody).substring(0, 300));
        }
      }
      
      return new Response(JSON.stringify(responseBody), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // POST: Save correction
    // ============================================
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'saveCorrection') {
        console.log('[AWS Proxy] Saving user correction:', body);
        
        // Validar campos obrigatórios
        if (!body.userId || !body.examId || !body.fieldName || !body.userValue) {
          console.error('[AWS Proxy] Missing required fields for correction');
          return new Response(
            JSON.stringify({ error: 'Missing required fields: userId, examId, fieldName, userValue' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validar fieldName permitido
        const ALLOWED_HEADER_FIELDS = ['paciente', 'laboratorio', 'data_exame', 'data_nascimento'];
        const ALLOWED_BIOMARKER_FIELDS = ['biomarker_name', 'biomarker_value', 'biomarker_unit', 'reference_min', 'reference_max', 'biomarker_status'];
        const ALL_ALLOWED_FIELDS = [...ALLOWED_HEADER_FIELDS, ...ALLOWED_BIOMARKER_FIELDS];
        
        if (!ALL_ALLOWED_FIELDS.includes(body.fieldName)) {
          console.error('[AWS Proxy] Invalid field name:', body.fieldName);
          return new Response(
            JSON.stringify({ error: `Invalid field name. Allowed: ${ALL_ALLOWED_FIELDS.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const response = await fetch(AWS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveCorrection',
            userId: body.userId,
            examId: body.examId,
            fieldName: body.fieldName,
            aiValue: body.aiValue || null,
            userValue: body.userValue,
            textSample: body.textSample || null,
            biomarkerId: body.biomarkerId || null, // ✅ NOVO: suporte para biomarkerId
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AWS Proxy] POST saveCorrection error:', response.status, errorText);
          throw new Error(`AWS Lambda error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[AWS Proxy] Save correction response:', data);
        
        let responseBody = data;
        if (data.body && typeof data.body === 'string') {
          try {
            responseBody = JSON.parse(data.body);
            console.log('[AWS Proxy] ✅ Correction saved successfully');
          } catch (e) {
            console.error('[AWS Proxy] ❌ Failed to parse correction response:', e);
          }
        } else if (data.body && typeof data.body === 'object') {
          responseBody = data.body;
        }
        
        return new Response(JSON.stringify(responseBody), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ============================================
      // POST: Save biomarker corrections (batch)
      // ============================================
      if (body.action === 'saveBiomarkerCorrections') {
        console.log('[AWS Proxy] Saving biomarker corrections batch:', body);
        
        // Validar campos obrigatórios
        if (!body.userId || !body.examId || !Array.isArray(body.corrections)) {
          console.error('[AWS Proxy] Missing required fields for biomarker corrections');
          return new Response(
            JSON.stringify({ error: 'Missing required fields: userId, examId, corrections (array)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validar cada correção no array
        const ALLOWED_BIOMARKER_FIELDS = ['biomarker_name', 'biomarker_value', 'biomarker_unit', 'reference_min', 'reference_max', 'biomarker_status'];
        for (const correction of body.corrections) {
          if (!correction.biomarkerId || !correction.fieldName || !correction.userValue) {
            return new Response(
              JSON.stringify({ error: 'Each correction must have: biomarkerId, fieldName, userValue' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (!ALLOWED_BIOMARKER_FIELDS.includes(correction.fieldName)) {
            return new Response(
              JSON.stringify({ error: `Invalid biomarker field: ${correction.fieldName}. Allowed: ${ALLOWED_BIOMARKER_FIELDS.join(', ')}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        const response = await fetch(AWS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveBiomarkerCorrections',
            userId: body.userId,
            examId: body.examId,
            corrections: body.corrections,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AWS Proxy] POST saveBiomarkerCorrections error:', response.status, errorText);
          throw new Error(`AWS Lambda error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[AWS Proxy] Biomarker corrections response:', data);
        
        let responseBody = data;
        if (data.body && typeof data.body === 'string') {
          try {
            responseBody = JSON.parse(data.body);
            console.log('[AWS Proxy] ✅ Biomarker corrections saved successfully');
          } catch (e) {
            console.error('[AWS Proxy] ❌ Failed to parse biomarker corrections response:', e);
          }
        } else if (data.body && typeof data.body === 'object') {
          responseBody = data.body;
        }
        
        return new Response(JSON.stringify(responseBody), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ============================================
      // POST: Export training data
      // ============================================
      if (body.action === 'exportTrainingData') {
        console.log('[AWS Proxy] Exporting training data for userId:', body.userId);
        
        // Verificar se o usuário é admin
        const { data: userRoles, error: roleError } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', body.userId);

        if (roleError || !userRoles || !userRoles.some(r => r.role === 'admin')) {
          console.log('[AWS Proxy] Access denied: User is not admin');
          return new Response(
            JSON.stringify({ error: 'Forbidden: Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const response = await fetch(AWS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'exportTrainingData',
            userId: body.userId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AWS Proxy] POST exportTrainingData error:', response.status, errorText);
          throw new Error(`AWS Lambda error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[AWS Proxy] Export training data response:', JSON.stringify(data).substring(0, 500));
        
        let responseBody = data;
        if (data.body && typeof data.body === 'string') {
          try {
            responseBody = JSON.parse(data.body);
            console.log('[AWS Proxy] ✅ Training data exported');
          } catch (e) {
            console.error('[AWS Proxy] ❌ Failed to parse export response:', e);
          }
        } else if (data.body && typeof data.body === 'object') {
          responseBody = data.body;
        }
        
        return new Response(JSON.stringify(responseBody), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ============================================
      // POST: Generate upload URL
      // ============================================
      console.log('[AWS Proxy] POST request:', body);
      
      // Receber contentType do cliente (se fornecido)
      const contentType = body.contentType || 'application/pdf';
      console.log('[AWS Proxy] Content-Type recebido:', contentType);
      
      const response = await fetch(AWS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: body.action || 'getUploadUrl',
          userId: body.userId,
          fileName: body.fileName,
          contentType: contentType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AWS Proxy] POST error:', response.status, errorText);
        throw new Error(`AWS Lambda error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AWS Proxy] POST response:', data);
      console.log('[AWS Proxy] Content-Type retornado pela AWS:', data.contentType);
      
      // Se a Lambda retornou um body como string, fazer parse
      let responseBody = data;
      if (data.body && typeof data.body === 'string') {
        try {
          responseBody = JSON.parse(data.body);
          console.log('[AWS Proxy] Body parsed successfully:', responseBody);
        } catch (e) {
          console.error('[AWS Proxy] Failed to parse Lambda body:', e);
        }
      }
      
      return new Response(JSON.stringify(responseBody), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('[AWS Proxy] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
