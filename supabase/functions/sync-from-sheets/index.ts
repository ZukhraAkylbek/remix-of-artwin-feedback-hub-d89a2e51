import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
  department?: string;
}

// Legacy status map for backward compatibility
const legacyStatusMap: Record<string, string> = {
  'Новая': 'new',
  'В работе': 'in_progress',
  'Решена': 'resolved',
  'new': 'new',
  'in_progress': 'in_progress',
  'resolved': 'resolved'
};

async function getAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  let processedKey = privateKey.replace(/\\n/g, '\n');

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();

  function base64url(input: string | Uint8Array): string {
    const bytes = typeof input === 'string' ? encoder.encode(input) : input;
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const headerB64 = base64url(JSON.stringify(header));
  const claimB64 = base64url(JSON.stringify(claim));
  const signatureInput = `${headerB64}.${claimB64}`;

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  
  const pemContents = processedKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/[\n\r\s]/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spreadsheetId, serviceAccountEmail, privateKey, department }: SyncRequest = await req.json();

    console.log('Sync from sheets request:', { spreadsheetId, department });

    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);

    // Get all data from the sheet (columns A to K - ID, Status, SubStatus)
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:K?majorDimension=ROWS`;
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!getResponse.ok) {
      throw new Error('Failed to read sheet data');
    }

    const sheetData = await getResponse.json();
    const rows = sheetData.values || [];

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all dynamic task statuses for the department
    let taskStatusesMap: Record<string, { id: string; name: string }> = {};
    let taskSubstatusesMap: Record<string, { id: string; name: string; statusId: string }> = {};
    
    if (department) {
      // Get task statuses for this department
      const { data: statusesData } = await supabase
        .from('task_statuses')
        .select('id, name')
        .eq('department', department)
        .eq('is_active', true);
      
      if (statusesData) {
        for (const status of statusesData) {
          // Map by name (case insensitive)
          taskStatusesMap[status.name.toLowerCase()] = { id: status.id, name: status.name };
        }

        // Get substatuses for these statuses
        const statusIds = statusesData.map(s => s.id);
        if (statusIds.length > 0) {
          const { data: substatusesData } = await supabase
            .from('task_substatuses')
            .select('id, name, status_id')
            .in('status_id', statusIds)
            .eq('is_active', true);
          
          if (substatusesData) {
            for (const substatus of substatusesData) {
              taskSubstatusesMap[substatus.name.toLowerCase()] = { 
                id: substatus.id, 
                name: substatus.name,
                statusId: substatus.status_id 
              };
            }
          }
        }
      }
    }

    let updatedCount = 0;
    const updates: { id: string; oldStatus: string; newStatus: string; subStatus?: string; taskStatusId?: string; taskSubstatusId?: string }[] = [];

    for (const row of rows) {
      const id = row[0];
      const sheetStatus = row[9]; // Column J (0-indexed = 9)
      const sheetSubStatus = row[10] || null; // Column K (0-indexed = 10)
      
      if (!id || !sheetStatus) continue;

      // Get current status from database
      const { data: current } = await supabase
        .from('feedback')
        .select('status, sub_status, task_status_id, task_substatus_id')
        .eq('id', id)
        .maybeSingle();

      if (!current) continue;

      // Try to find matching dynamic status first
      const sheetStatusLower = sheetStatus.toLowerCase();
      const dynamicStatus = taskStatusesMap[sheetStatusLower];
      
      // Prepare update data
      const updateData: Record<string, unknown> = {};
      let hasChanges = false;

      if (dynamicStatus) {
        // Use dynamic status system
        if (current.task_status_id !== dynamicStatus.id) {
          updateData.task_status_id = dynamicStatus.id;
          hasChanges = true;
        }

        // Handle substatus
        if (sheetSubStatus) {
          const sheetSubStatusLower = sheetSubStatus.toLowerCase();
          const dynamicSubstatus = taskSubstatusesMap[sheetSubStatusLower];
          
          if (dynamicSubstatus && dynamicSubstatus.statusId === dynamicStatus.id) {
            if (current.task_substatus_id !== dynamicSubstatus.id) {
              updateData.task_substatus_id = dynamicSubstatus.id;
              hasChanges = true;
            }
          } else {
            // Clear substatus if not found or doesn't match status
            if (current.task_substatus_id) {
              updateData.task_substatus_id = null;
              hasChanges = true;
            }
          }
        } else if (current.task_substatus_id) {
          updateData.task_substatus_id = null;
          hasChanges = true;
        }
      } else {
        // Fallback to legacy status system
        const normalizedStatus = legacyStatusMap[sheetStatus] || sheetStatus;
        
        if (current.status !== normalizedStatus) {
          updateData.status = normalizedStatus;
          hasChanges = true;
        }

        // Handle legacy sub_status
        if (normalizedStatus === 'in_progress' && sheetSubStatus) {
          if (current.sub_status !== sheetSubStatus) {
            updateData.sub_status = sheetSubStatus;
            hasChanges = true;
          }
        } else if (normalizedStatus !== 'in_progress' && current.sub_status) {
          updateData.sub_status = null;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        const { error } = await supabase
          .from('feedback')
          .update(updateData)
          .eq('id', id);

        if (!error) {
          updatedCount++;
          updates.push({ 
            id, 
            oldStatus: current.status, 
            newStatus: dynamicStatus?.name || sheetStatus, 
            subStatus: sheetSubStatus,
            taskStatusId: updateData.task_status_id as string | undefined,
            taskSubstatusId: updateData.task_substatus_id as string | undefined
          });
          console.log(`Updated ${id}:`, updateData);
        }
      }
    }

    console.log(`Sync complete. Updated ${updatedCount} records.`);

    return new Response(
      JSON.stringify({ success: true, updatedCount, updates }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
