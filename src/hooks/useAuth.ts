import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      const { data } = await client.auth.getSession();
      if (isMounted) {
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      }
    };

    initialize();

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (!supabase) {
      throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return { user, isLoading, loginWithGoogle, logout };
}
