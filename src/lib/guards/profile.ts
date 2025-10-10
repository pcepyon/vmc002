import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * 프로필 완성도 확인 후 온보딩으로 리다이렉트
 */
export async function requireCompleteProfile() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (!profile || !profile.name || !profile.phone || !profile.role) {
    redirect('/auth/onboarding');
  }

  return profile;
}

/**
 * 프로필 완성도 확인 (리다이렉트 없이)
 */
export async function checkProfileCompletion() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isComplete: false, needsAuth: true };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (!profile || !profile.name || !profile.phone || !profile.role) {
    return { isComplete: false, needsAuth: false };
  }

  return { isComplete: true, needsAuth: false, profile };
}

/**
 * 사용자 역할 확인
 */
export async function getUserRole(): Promise<'learner' | 'instructor' | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

  return profile?.role || null;
}

/**
 * 특정 역할 요구
 */
export async function requireRole(requiredRole: 'learner' | 'instructor') {
  const role = await getUserRole();

  if (role !== requiredRole) {
    redirect('/');
  }

  return role;
}