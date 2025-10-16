import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AWS_API_URL = "https://uretx67kbrqws3kmsjfwun2w340mtbgo.lambda-url.us-east-1.on.aws/";

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
      console.log('[AWS Proxy] GET request for userId:', userId);
      
      const response = await fetch(`${AWS_API_URL}?userId=${userId}`);
      const data = await response.json();
      
      console.log('[AWS Proxy] GET response:', data);
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Generate upload URL
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('[AWS Proxy] POST request:', body);
      
      const response = await fetch(AWS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AWS Proxy] POST error:', response.status, errorText);
        throw new Error(`AWS Lambda error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AWS Proxy] POST response:', data);
      
      return new Response(JSON.stringify(data), {
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
