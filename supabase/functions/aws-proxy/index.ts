import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AWS_API_URL = "https://55oeqt4sk2.execute-api.us-east-1.amazonaws.com/prod/exam-url";

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

    // GET: Fetch exam status
    if (req.method === 'GET' && userId) {
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
      console.log('[AWS Proxy] GET (POST) response:', data);
      
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

    // POST: Generate upload URL
    if (req.method === 'POST') {
      const body = await req.json();
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
