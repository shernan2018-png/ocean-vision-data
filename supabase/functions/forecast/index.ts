import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📩 Solicitud recibida desde Lovable Cloud:");
    const body = await req.json();
    console.log(body);

    // 🔴 Cambia esta URL por tu túnel ngrok real:
    const NGROK_URL = "https://ophthalmic-rolf-ungallant.ngrok-free.dev";

    console.log("📤 Enviando datos a tu servidor MATLAB en ngrok...");
    const response = await fetch(`${NGROK_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.text(); // MATLAB a veces devuelve texto JSON plano
    console.log("📥 Respuesta recibida desde tu PC (MATLAB):", data);

    // Si la respuesta ya es JSON válido, se reenvía igual
    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error en forecast function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
