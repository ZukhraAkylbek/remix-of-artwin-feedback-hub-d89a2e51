import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  spreadsheetId: string;
  feedbackId: string;
  newStatus: string;
  newSubStatus?: string;
  serviceAccountEmail: string;
  privateKey: string;
}

async function getAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  let processedKey = privateKey.replace(/\\n/g, '\n');

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
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
    const { spreadsheetId, feedbackId, newStatus, newSubStatus, serviceAccountEmail, privateKey }: UpdateRequest = await req.json();

    console.log('Update status request:', { spreadsheetId, feedbackId, newStatus, newSubStatus });

    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);

    // Get all data from column A (IDs) to find the row
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
    
    // Find the row with matching ID
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === feedbackId) {
        rowIndex = i + 1; // 1-indexed for Sheets API
        break;
      }
    }

    if (rowIndex === -1) {
      console.log('Feedback ID not found in sheet (not synced yet):', feedbackId);
      return new Response(
        JSON.stringify({ success: true, skipped: true, message: 'ID not in sheet yet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the status cell (column J) and sub-status (column K)
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/J${rowIndex}:K${rowIndex}?valueInputOption=RAW`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[newStatus, newSubStatus || '']] }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update: ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log('Status updated in sheet:', result);

    return new Response(
      JSON.stringify({ success: true, rowIndex }),
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