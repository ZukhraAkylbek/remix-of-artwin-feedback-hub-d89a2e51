import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetsRequest {
  spreadsheetId: string;
  range: string;
  values: (string | number | boolean)[][];
  serviceAccountEmail: string;
  privateKey: string;
}

async function getAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const normalizedEmail = (serviceAccountEmail || '').trim();
  const normalizedKey = (privateKey || '').trim();

  if (!normalizedEmail || !normalizedKey) {
    throw new Error('Missing Google service account credentials');
  }

  // Handle different formats of private key storage
  // The key might have literal \n or actual newlines
  let processedKey = normalizedKey.replace(/\\n/g, '\n');

  console.log('Service account email:', normalizedEmail);
  console.log('Private key starts with:', processedKey.substring(0, 50));

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: normalizedEmail,
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

  // Import the private key - ensure proper PEM format
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  
  // Check if the key has proper PEM headers
  if (!processedKey.includes(pemHeader)) {
    throw new Error('Private key must include PEM header: -----BEGIN PRIVATE KEY-----');
  }
  
  const pemContents = processedKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/[\n\r\s]/g, '');
  
  console.log('PEM contents length:', pemContents.length);
  
  let binaryKey: Uint8Array;
  try {
    binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    console.log('Binary key length:', binaryKey.length);
  } catch (e) {
    throw new Error(`Failed to decode base64 private key: ${e}`);
  }
  
  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey.buffer as ArrayBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } catch (e) {
    throw new Error(`Failed to import private key. Make sure you're using the complete private_key from the JSON file, including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----. Error: ${e}`);
  }

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Get the next empty row in column A
async function getNextRow(spreadsheetId: string, accessToken: string): Promise<number> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:A?majorDimension=COLUMNS`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.log('Could not get existing data, starting from row 1');
    return 1;
  }

  const data = await response.json();
  
  // If no values in column A, start from row 1
  if (!data.values || !data.values[0]) {
    return 1;
  }
  
  // Return the next row after the last filled one
  return data.values[0].length + 1;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spreadsheetId, range, values, serviceAccountEmail, privateKey }: SheetsRequest = await req.json();

    console.log('Received request:', { spreadsheetId, range, valuesCount: values?.length, hasCredentials: !!serviceAccountEmail && !!privateKey });

    if (!spreadsheetId || !range || !values) {
      return new Response(
        JSON.stringify({ error: 'Нужно передать spreadsheetId, range и values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!serviceAccountEmail || !privateKey) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют учетные данные Google сервисного аккаунта. Добавьте их в настройках админки.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
    console.log('Got access token');

    // Get next available row in column A
    const nextRow = await getNextRow(spreadsheetId, accessToken);
    console.log('Next row to insert:', nextRow);

    // Use PUT to directly set values at specific range starting from column A to P (16 columns)
    const specificRange = `A${nextRow}:P${nextRow}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(specificRange)}?valueInputOption=RAW`;
    
    console.log('Calling Google Sheets API:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Google Sheets API error: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Successfully wrote to sheet:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in submit-to-sheets function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});