import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bitrix task status mapping
const bitrixStatusToAppStatus: Record<number, string> = {
  1: 'new',           // Новая
  2: 'in_progress',   // Ожидает выполнения
  3: 'in_progress',   // Выполняется
  4: 'in_progress',   // Ожидает контроля
  5: 'resolved',      // Завершена
  6: 'resolved',      // Отложена
  7: 'resolved',      // Отклонена
};

interface SyncRequest {
  webhookUrl: string;
  department: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json();
    const { webhookUrl, department } = body;

    console.log('Syncing Bitrix statuses for department:', department);

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook URL not provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all feedback with bitrix_task_id for this department
    const { data: feedbackItems, error: fetchError } = await supabase
      .from('feedback')
      .select('id, bitrix_task_id, status, sub_status')
      .eq('department', department)
      .not('bitrix_task_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching feedback:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!feedbackItems || feedbackItems.length === 0) {
      console.log('No feedback items with Bitrix tasks found');
      return new Response(
        JSON.stringify({ success: true, updatedCount: 0, message: 'No items to sync' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updatedCount = 0;

    // Check each task status in Bitrix
    for (const item of feedbackItems) {
      try {
        const taskResponse = await fetch(`${webhookUrl}/tasks.task.get.json?taskId=${item.bitrix_task_id}`);
        const taskData = await taskResponse.json();

        if (taskData.error) {
          console.error(`Error fetching Bitrix task ${item.bitrix_task_id}:`, taskData.error);
          continue;
        }

        const bitrixStatus = taskData.result?.task?.status;
        const newStatus = bitrixStatusToAppStatus[bitrixStatus] || 'in_progress';

        // Only update if status changed and is now resolved
        if (newStatus !== item.status) {
          const { error: updateError } = await supabase
            .from('feedback')
            .update({ 
              status: newStatus,
              sub_status: newStatus === 'resolved' ? null : item.sub_status
            })
            .eq('id', item.id);

          if (updateError) {
            console.error(`Error updating feedback ${item.id}:`, updateError);
          } else {
            console.log(`Updated feedback ${item.id} to status: ${newStatus}`);
            updatedCount++;
          }
        }
      } catch (taskError) {
        console.error(`Error processing task ${item.bitrix_task_id}:`, taskError);
      }
    }

    console.log(`Sync complete. Updated ${updatedCount} items.`);

    return new Response(
      JSON.stringify({ success: true, updatedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bitrix sync error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
