import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    console.log('Fetching catalog:', type);

    let url = '';
    if (type === 'reporters') {
      url = 'https://comtradeapi.un.org/files/v1/app/reference/Reporters.json';
    } else if (type === 'partners') {
      url = 'https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json';
    } else {
      throw new Error('Invalid catalog type');
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type}: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Catalog ${type} fetched successfully`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in comtrade-catalogs function:', error);
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
