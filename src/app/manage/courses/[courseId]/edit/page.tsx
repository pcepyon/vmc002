'use client';

import { use } from 'react';
import { CourseEditor } from '@/features/course/components/manage/CourseEditor';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type CourseRow = Database['public']['Tables']['courses']['Row'];

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function EditCoursePage({ params }: PageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const { user, role, isLoading: userLoading } = useCurrentUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkCourseOwnership = async () => {
      if (userLoading) return;

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      if (role !== 'instructor') {
        router.push('/dashboard');
        return;
      }

      // 코스 소유권 확인
      const supabase = getSupabaseBrowserClient();
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single<CourseRow>();

      if (!course || course.instructor_id !== user.id) {
        router.push('/manage/courses');
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkCourseOwnership();
  }, [user, role, userLoading, router, courseId]);

  if (userLoading || isChecking || !isAuthorized) {
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
      <CourseEditor courseId={courseId} />
    </div>
  );
}