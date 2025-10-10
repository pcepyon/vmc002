'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useOnboardingStore } from '@/features/onboarding/store';
import { RoleSelector } from '@/components/role/RoleSelector';
import { ProfileForm, type ProfileFormData } from '@/components/profile/ProfileForm';
import { TermsAgreement } from '@/components/terms/TermsAgreement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft } from 'lucide-react';
import { apiClient } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import type { CompleteProfileRequest } from '@/features/profile/lib/dto';
import type { Database } from '@/lib/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    step,
    role,
    profileData,
    setRole,
    setProfileData,
    setTermsAgreed,
    nextStep,
    prevStep,
    reset
  } = useOnboardingStore();

  useEffect(() => {
    // 사용자 인증 상태 확인
    const checkAuth = async () => {
      // 세션 먼저 확인 (회원가입 직후에는 세션이 있어야 함)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // 세션이 없으면 로그인 필요
        router.push('/auth/signin');
        return;
      }

      // 이미 프로필이 완성되었는지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single<ProfileRow>();

      if (profile && profile.name && profile.phone && profile.role) {
        // 이미 온보딩 완료
        const redirectUrl = profile.role === 'learner' ? '/courses' : '/dashboard/instructor';
        router.push(redirectUrl);
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleRoleSelect = (selectedRole: 'learner' | 'instructor') => {
    setRole(selectedRole);
    nextStep();
  };

  const handleProfileSubmit = (data: ProfileFormData) => {
    setProfileData(data);
    nextStep();
  };

  const handleTermsAgree = async () => {
    if (!role || !profileData) {
      toast({
        title: '오류',
        description: '필수 정보가 누락되었습니다.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    setTermsAgreed(true);

    try {
      // 먼저 현재 세션 확인
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: '인증 필요',
          description: '다시 로그인해 주세요.',
          variant: 'destructive'
        });
        router.push('/auth/signin');
        return;
      }

      const requestData: CompleteProfileRequest = {
        role,
        name: profileData.name,
        phone: profileData.phone,
        termsAgreed: true
      };

      const response = await apiClient.post('/api/profile/complete', requestData);

      if (response.data.success) {
        toast({
          title: '프로필 완성',
          description: '온보딩이 완료되었습니다.'
        });

        reset();
        router.push(response.data.data.redirectUrl);
      } else {
        throw new Error(response.data.error?.message || '프로필 저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);

      // 401 에러 특별 처리
      if (error.response?.status === 401) {
        toast({
          title: '인증 오류',
          description: '세션이 만료되었습니다. 다시 로그인해 주세요.',
          variant: 'destructive'
        });
        router.push('/auth/signin');
      } else {
        toast({
          title: '오류',
          description: error instanceof Error ? error.message : '프로필 저장에 실패했습니다.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepNumber = () => {
    const steps = ['role', 'profile', 'terms'];
    return steps.indexOf(step) + 1;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'role':
        return '역할 선택';
      case 'profile':
        return '프로필 정보';
      case 'terms':
        return '약관 동의';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'role':
        return '플랫폼에서 사용할 역할을 선택해주세요';
      case 'profile':
        return '기본 정보를 입력해주세요';
      case 'terms':
        return '서비스 이용약관에 동의해주세요';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {step !== 'role' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle>{getStepTitle()}</CardTitle>
                <CardDescription>{getStepDescription()}</CardDescription>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {getStepNumber()} / 3
            </div>
          </div>
          <Progress value={(getStepNumber() / 3) * 100} />
        </CardHeader>
        <CardContent>
          {step === 'role' && (
            <RoleSelector
              value={role || undefined}
              onChange={handleRoleSelect}
              disabled={isSubmitting}
            />
          )}

          {step === 'profile' && (
            <ProfileForm
              onSubmit={handleProfileSubmit}
              defaultValues={profileData || undefined}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 'terms' && (
            <TermsAgreement
              onAgree={handleTermsAgree}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}