import type { User } from '@supabase/supabase-js';

const ADMIN_EMAILS_ENV = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;

export function getAdminEmails() {
  return (ADMIN_EMAILS_ENV ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function isAdminUser(user: User | null) {
  return isAdminEmail(user?.email);
}
