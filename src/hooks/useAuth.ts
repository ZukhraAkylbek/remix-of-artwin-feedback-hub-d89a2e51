import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Department } from '@/types/feedback';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  department: Department | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    department: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer admin role and department check to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRoleAndDepartment(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, isAdmin: false, department: null, loading: false }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        checkAdminRoleAndDepartment(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRoleAndDepartment = async (userId: string) => {
    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    // Check department
    const { data: deptData } = await supabase
      .from('user_departments')
      .select('department')
      .eq('user_id', userId)
      .maybeSingle();

    setAuthState(prev => ({
      ...prev,
      isAdmin: !roleError && roleData !== null,
      department: (deptData?.department as Department) || null,
      loading: false,
    }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      session: null,
      isAdmin: false,
      department: null,
      loading: false,
    });
  };

  return {
    ...authState,
    signOut,
  };
}
