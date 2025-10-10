'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // URL에 토큰이 있으면 비밀번호 재설정 모드로
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    if (token && type === 'recovery') {
      setMode('reset');
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password?type=recovery`,
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message === 'User not found'
            ? '등록되지 않은 이메일입니다.'
            : error.message || '오류가 발생했습니다.',
        });
      } else {
        setMessage({
          type: 'success',
          text: '비밀번호 재설정 링크를 이메일로 전송했습니다. 이메일을 확인해주세요.',
        });
        setEmail('');
      }
    } catch (error) {
      console.error('Reset request error:', error);
      setMessage({
        type: 'error',
        text: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: '비밀번호가 일치하지 않습니다.',
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: '비밀번호는 최소 8자 이상이어야 합니다.',
      });
      setIsSubmitting(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || '비밀번호 변경에 실패했습니다.',
        });
      } else {
        setMessage({
          type: 'success',
          text: '비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.',
        });
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({
        type: 'error',
        text: '비밀번호 변경 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {mode === 'request' ? '비밀번호 재설정' : '새 비밀번호 설정'}
          </CardTitle>
          <CardDescription>
            {mode === 'request'
              ? '가입하신 이메일로 재설정 링크를 보내드립니다.'
              : '새로운 비밀번호를 입력해주세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
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
                    전송 중...
                  </>
                ) : (
                  '재설정 링크 보내기'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  새 비밀번호
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="새 비밀번호를 입력하세요"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  새 비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="새 비밀번호를 다시 입력하세요"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
                )}
              </div>

              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || newPassword !== confirmPassword}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </Button>
            </form>
          )}

          <div className="mt-4 pt-4 border-t text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}