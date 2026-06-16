import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isAdminUser } from '../../lib/adminAccess';
import { supabase } from '../../services/supabaseClient';

type AuthButtonProps = {
  fullWidth?: boolean;
  onActionComplete?: () => void;
  showStatus?: boolean;
};

export default function AuthButton({ fullWidth = false, onActionComplete, showStatus = true }: AuthButtonProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const initSession = async () => {
      const { data } = await client.auth.getSession();
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      console.warn('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      console.error('Google login failed:', error.message);
      return;
    }

    onActionComplete?.();
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    onActionComplete?.();
  };

  if (loading) {
    return <span className={`rounded-md border border-white/10 bg-white/6 px-3 py-2 text-xs text-smoke ${fullWidth ? 'block w-full text-center' : ''}`}>Loading...</span>;
  }

  if (!supabase) {
    return <span className={`rounded-md border border-champagne/30 bg-champagne/10 px-3 py-2 text-xs text-champagne ${fullWidth ? 'block w-full text-center' : ''}`}>Set .env</span>;
  }

  return session ? (
    <div className={`flex items-center gap-2 ${fullWidth ? 'w-full flex-col items-stretch' : ''}`}>
      {showStatus && (
      <span className={`rounded-md border border-sage/30 bg-sage/10 px-3 py-2 text-xs text-sage ${fullWidth ? 'block text-center' : 'hidden md:block'}`}>
        {isAdminUser(session.user) ? 'Admin aktif' : 'Login aktif'}
      </span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        className={`rounded-md border border-white/10 bg-white/7 px-3 py-2 text-sm font-semibold text-porcelain hover:bg-white/12 ${fullWidth ? 'w-full' : ''}`}
      >
        Logout
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className={`rounded-md bg-sage px-3 py-2 text-sm font-bold text-ink hover:bg-[#b7e3d0] ${fullWidth ? 'w-full' : ''}`}
    >
      Login
    </button>
  );
}
