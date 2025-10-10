'use client';

import { CourseCreationForm } from '@/features/course/components/manage/CourseCreationForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Loader2 } from 'lucide-react';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, role, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (role !== 'instructor') {
        router.push('/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user || role !== 'instructor') {
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
      <CourseCreationForm />
    </div>
  );
}