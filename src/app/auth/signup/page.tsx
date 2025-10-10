'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function SignUpPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    const password = formState.password;
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    });
  }, [formState.password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);

      // 비밀번호 확인
      if (formState.password !== formState.passwordConfirm) {
        setErrorMessage('비밀번호가 일치하지 않습니다.');
        setIsSubmitting(false);
        return;
      }

      // 비밀번호 강도 확인
      const isValidPassword = Object.values(passwordStrength).every(v => v);
      if (!isValidPassword) {
        setErrorMessage('비밀번호 요구사항을 모두 충족해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 약관 동의 확인
      if (!formState.agreeToTerms) {
        setErrorMessage('이용약관에 동의해주세요.');
        setIsSubmitting(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();

      try {
        const { data, error } = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setErrorMessage('이미 등록된 이메일입니다.');
          } else {
            setErrorMessage(error.message || '회원가입에 실패했습니다.');
          }
          return;
        }

        // 세션이 있으면 즉시 온보딩으로 (이메일 확인 비활성화 상태)
        // 세션이 없으면 이메일 확인 필요 메시지
        if (data.session) {
          router.push('/auth/onboarding');
        } else {
          setErrorMessage('회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.');
        }
      } catch (error) {
        console.error('Signup error:', error);
        setErrorMessage('회원가입 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, passwordStrength, router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            새 계정을 만들어 학습을 시작하세요
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
                autoComplete="new-password"
                placeholder="비밀번호를 입력하세요"
                disabled={isSubmitting}
              />
              {formState.password && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.hasMinLength ? <Check className="h-3 w-3" /> : <span className="w-3 h-3 text-xs">•</span>}
                      최소 8자 이상
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.hasUpperCase ? <Check className="h-3 w-3" /> : <span className="w-3 h-3 text-xs">•</span>}
                      대문자 포함
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.hasLowerCase ? <Check className="h-3 w-3" /> : <span className="w-3 h-3 text-xs">•</span>}
                      소문자 포함
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.hasNumber ? <Check className="h-3 w-3" /> : <span className="w-3 h-3 text-xs">•</span>}
                      숫자 포함
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.hasSpecialChar ? <Check className="h-3 w-3" /> : <span className="w-3 h-3 text-xs">•</span>}
                      특수문자 포함
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="passwordConfirm" className="text-sm font-medium">
                비밀번호 확인
              </label>
              <Input
                id="passwordConfirm"
                type="password"
                value={formState.passwordConfirm}
                onChange={(e) => setFormState(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                required
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력하세요"
                disabled={isSubmitting}
              />
              {formState.passwordConfirm && formState.password !== formState.passwordConfirm && (
                <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formState.agreeToTerms}
                onCheckedChange={(checked) =>
                  setFormState(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                }
                disabled={isSubmitting}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Link href="/terms" className="text-primary hover:underline">
                  이용약관
                </Link>
                {' 및 '}
                <Link href="/privacy" className="text-primary hover:underline">
                  개인정보처리방침
                </Link>
                에 동의합니다
              </label>
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
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t text-center text-sm">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/auth/signin"
              className="text-primary hover:underline font-medium"
            >
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}