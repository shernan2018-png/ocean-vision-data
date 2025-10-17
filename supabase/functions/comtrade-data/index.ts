import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComtradeParams {
  reporterCode: string;
  partnerCode?: string;
  cmdCode: string;
  flowCode: string;
  freq: string;
  period: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reporterCode, partnerCode, cmdCode, flowCode, freq, period }: ComtradeParams = await req.json();

    console.log('Fetching Comtrade data:', { reporterCode, partnerCode, cmdCode, flowCode, freq, period });

    const partnerParam = partnerCode || '0'; // 0 = World
    const url = `https://comtradeplus.un.org/api/v1/getHS?reporterCode=${reporterCode}&partnerCode=${partnerParam}&cmdCode=${cmdCode}&flowCode=${flowCode}&freq=${freq}&period=${period}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Comtrade API error:', response.status, await response.text());
      throw new Error(`Comtrade API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Comtrade data fetched successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in comtrade-data function:', error);
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
