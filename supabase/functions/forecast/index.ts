import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📩 Solicitud recibida desde Lovable Cloud:');
    const body = await req.json();
    console.log(body);

    // Return mock forecast data
    const forecastData = [
      { period: "202501", value: 120.5 },
      { period: "202502", value: 122.1 },
      { period: "202503", value: 124.9 },
    ];

    console.log('✅ Enviando datos de pronóstico:', forecastData);

    return new Response(
      JSON.stringify(forecastData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error en forecast function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
