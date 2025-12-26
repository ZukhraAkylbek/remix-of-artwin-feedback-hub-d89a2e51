import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepartmentUser {
  email: string;
  password: string;
  department: string;
}

const departmentUsers: DepartmentUser[] = [
  { email: 'management@artwin.kg', password: 'artwinmain', department: 'rukovodstvo' },
  { email: 'reception@artwin.kg', password: 'artwinreception', department: 'service_aho' },
  { email: 'hse@artwin.kg', password: 'artwinhse', department: 'otitb_hse' },
  { email: 'zakup@artwin.kg', password: 'artwinzakup', department: 'omto' },
  { email: 'sales@artwin.kg', password: 'artwinsales', department: 'zamgd_kom' },
  { email: 'hr@artwin.kg', password: 'artwinhr', department: 'hr' },
  { email: 'marketing@artwin.kg', password: 'artwinmarketing', department: 'zamgd_kom' },
  { email: 'clients@artwin.kg', password: 'artwinclients', department: 'ssl' },
  { email: 'tech@artwin.kg', password: 'artwintech', department: 'zamgd_tech' },
  { email: 'safety@artwin.kg', password: 'artwinsafety', department: 'security' },
  { email: 'fin@artwin.kg', password: 'artwinfin', department: 'finance' },
  { email: 'law@artwin.kg', password: 'artwinlaw', department: 'legal' },
  { email: 'razv@artwin.kg', password: 'artwinrazv', department: 'otd_razv' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of departmentUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      
      if (existingUser) {
        // User exists, update password and department
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: user.password }
        );

        const { error: deptError } = await supabase
          .from('user_departments')
          .upsert({
            user_id: existingUser.id,
            department: user.department
          }, { onConflict: 'user_id' });

        if (updateError || deptError) {
          results.push({ email: user.email, success: false, error: `Update error: ${updateError?.message || deptError?.message}` });
        } else {
          results.push({ email: user.email, success: true, error: 'User updated with new password' });
        }
        continue;
      }

      // Create user with admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: user.email, success: false, error: authError.message });
        continue;
      }

      if (authData.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin'
          });

        if (roleError) {
          results.push({ email: user.email, success: false, error: `Role error: ${roleError.message}` });
          continue;
        }

        // Add department assignment
        const { error: deptError } = await supabase
          .from('user_departments')
          .insert({
            user_id: authData.user.id,
            department: user.department
          });

        if (deptError) {
          results.push({ email: user.email, success: false, error: `Department error: ${deptError.message}` });
        } else {
          results.push({ email: user.email, success: true });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
