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
  typeCode?: string;  // C = Goods, S = Services
  clCode?: string;    // HS, SITC, etc.
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const primaryKey = Deno.env.get('COMTRADE_PRIMARY_KEY');
    
    if (!primaryKey) {
      throw new Error('COMTRADE_PRIMARY_KEY is not configured');
    }

    const { reporterCode, partnerCode, cmdCode, flowCode, freq, period, typeCode = 'C', clCode = 'HS' }: ComtradeParams = await req.json();

    console.log('Fetching Comtrade data:', { reporterCode, partnerCode, cmdCode, flowCode, freq, period, typeCode, clCode });

    // Build the new API URL - the new API uses /data/v1/get/{typeCode}/{freqCode}/{clCode} format
    const partnerParam = partnerCode || '0'; // 0 = World
    const url = `https://comtradeplus.un.org/data/v1/get/${typeCode}/${freq}/${clCode}`;
    
    // Build query parameters
    const params = new URLSearchParams({
      reporterCode,
      partnerCode: partnerParam,
      cmdCode,
      flowCode,
      period,
    });

    const fullUrl = `${url}?${params.toString()}`;
    console.log('Requesting URL:', fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': primaryKey,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Comtrade API error:', response.status, errorText);
      throw new Error(`Comtrade API returned status ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
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
