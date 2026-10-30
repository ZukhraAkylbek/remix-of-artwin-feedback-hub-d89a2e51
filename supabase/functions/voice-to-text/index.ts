import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Распознавание через Lovable AI gateway (внутри Lovable Cloud)
async function transcribeWithLovable(audio: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are a transcription assistant. You will receive audio data encoded in base64. Your task is to transcribe the spoken words accurately into text. Return ONLY the transcribed text, nothing else. If you cannot transcribe the audio, return an empty string."
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: { data: audio, format: "wav" }
            },
            {
              type: "text",
              text: "Please transcribe this audio recording."
            }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Распознавание через OpenAI Whisper (для своего сервера)
async function transcribeWithOpenAI(audio: string, apiKey: string): Promise<string> {
  // base64 -> bytes
  const binary = atob(audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: "audio/webm" }), "recording.webm");
  formData.append("model", "whisper-1");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI Whisper error:", response.status, errorText);
    if (response.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`OpenAI Whisper error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    let text: string;

    if (LOVABLE_API_KEY) {
      text = await transcribeWithLovable(audio, LOVABLE_API_KEY);
    } else if (OPENAI_API_KEY) {
      // Автоматический переход на OpenAI Whisper на своём сервере
      text = await transcribeWithOpenAI(audio, OPENAI_API_KEY);
    } else {
      return new Response(
        JSON.stringify({ error: "Голосовой ввод не настроен: добавьте ключ в selfhost/functions.env" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error in voice-to-text:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === "RATE_LIMIT") {
      return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message === "PAYMENT_REQUIRED") {
      return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
