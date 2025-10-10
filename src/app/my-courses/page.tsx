'use client';

import { MyCoursesList } from '@/features/enrollment/components/MyCoursesList';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Loader2 } from 'lucide-react';

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, role, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (role !== 'learner') {
        router.push('/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user || role !== 'learner') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">내 코스</h1>
        <p className="text-muted-foreground mt-2">현재 수강 중인 코스를 확인하고 학습을 계속하세요</p>
      </div>
      <MyCoursesList />
    </div>
  );
}