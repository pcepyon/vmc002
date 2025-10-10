'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, refresh } = useCurrentUser();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // 이미 로그인된 사용자가 있으면 대시보드로 이동
  useEffect(() => {
    if (!isLoading && user && !isSubmitting) {
      // window.location을 사용하여 서버 재로딩
      const targetUrl = redirectTo === '/dashboard' ? '/dashboard' : redirectTo;
      window.location.href = targetUrl;
    }
  }, [user, isLoading, redirectTo, isSubmitting]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);

      const supabase = getSupabaseBrowserClient();

      try {
        console.log('[DEBUG] Starting login process...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formState.email,
          password: formState.password,
        });

        console.log('[DEBUG] Auth response:', { data, error });

        if (error) {
          console.error('[DEBUG] Auth error:', error);
          setErrorMessage(error.message === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : error.message || '로그인에 실패했습니다.');
          return;
        }

        if (data.user) {
          console.log('[DEBUG] User authenticated:', data.user.id);

          // 프로필 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select()
            .eq('id', data.user.id)
            .single();

          console.log('[DEBUG] Profile query result:', { profile, profileError });

          if (profileError) {
            console.error('[DEBUG] Profile query error:', profileError);
            setErrorMessage('프로필 정보를 가져오는데 실패했습니다.');
            return;
          }

          const profileData = profile as { name?: string; phone?: string; role?: string } | null;

          if (!profileData?.name || !profileData?.phone || !profileData?.role) {
            console.log('[DEBUG] Profile incomplete, redirecting to onboarding');
            await refresh();
            window.location.href = '/auth/onboarding';
          } else {
            const dashboardUrl = profileData.role === 'instructor'
              ? '/dashboard/instructor'
              : '/dashboard/learner';
            const finalUrl = redirectTo === '/dashboard' ? dashboardUrl : redirectTo;
            console.log('[DEBUG] Redirecting to:', finalUrl);
            console.log('[DEBUG] Refreshing auth context...');
            await refresh();
            console.log('[DEBUG] Performing hard redirect...');
            window.location.href = finalUrl;
          }
        } else {
          console.error('[DEBUG] No user data received');
          setErrorMessage('로그인에 실패했습니다.');
        }
      } catch (error) {
        console.error('[DEBUG] Login error:', error);
        setErrorMessage('로그인 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, router, redirectTo, refresh]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>
            LMS Platform에 로그인하여 학습을 계속하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                required
                autoComplete="email"
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                required
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link
              href="/auth/reset-password"
              className="hover:text-primary transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t text-center text-sm">
            계정이 없으신가요?{' '}
            <Link
              href="/auth/signup"
              className="text-primary hover:underline font-medium"
            >
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}