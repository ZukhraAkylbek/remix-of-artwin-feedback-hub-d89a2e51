import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BitrixRequest {
  webhookUrl: string;
  title: string;
  description: string;
  type: string;
  urgency: string;
  department: string;
  contactName?: string;
  contactInfo?: string;
  feedbackId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BitrixRequest = await req.json();
    const { webhookUrl, title, description, type, urgency, department, contactName, contactInfo, feedbackId } = body;

    console.log('Bitrix24 request:', { webhookUrl: webhookUrl?.slice(0, 50), title, feedbackId });

    if (!webhookUrl) {
      console.log('Bitrix webhook URL not provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook URL not provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare task description
    const fullDescription = `
📋 Тип: ${type}
⚡ Срочность: ${urgency}
🏢 Департамент: ${department}
${contactName ? `👤 От: ${contactName}` : '👤 От: Анонимно'}
${contactInfo ? `📞 Контакт: ${contactInfo}` : ''}

📝 Сообщение:
${description}

---
ID обращения: ${feedbackId}
    `.trim();

    // Create task in Bitrix24
    const taskData = {
      fields: {
        TITLE: title,
        DESCRIPTION: fullDescription,
        PRIORITY: urgency === 'Срочно' ? '2' : '1', // 2 = High, 1 = Normal
        RESPONSIBLE_ID: 1, // Default to admin user, can be configured
        CREATED_BY: 1,
        GROUP_ID: 0,
        TAGS: [type, department],
      }
    };

    console.log('Creating Bitrix24 task:', taskData.fields.TITLE);

    const bitrixResponse = await fetch(`${webhookUrl}/tasks.task.add.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    const bitrixResult = await bitrixResponse.json();
    console.log('Bitrix24 response:', bitrixResult);

    if (bitrixResult.error) {
      console.error('Bitrix24 error:', bitrixResult.error_description || bitrixResult.error);
      return new Response(
        JSON.stringify({ success: false, error: bitrixResult.error_description || bitrixResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskId = bitrixResult.result?.task?.id || bitrixResult.result;
    console.log('Bitrix24 task created with ID:', taskId);

    return new Response(
      JSON.stringify({ success: true, taskId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bitrix24 error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
