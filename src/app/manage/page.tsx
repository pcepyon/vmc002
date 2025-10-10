'use client';

import { InstructorDashboard } from '@/features/course/components/manage/InstructorDashboard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type CourseRow = Database['public']['Tables']['courses']['Row'];

export default function ManagePage() {
  const router = useRouter();
  const { user, role, isLoading: userLoading } = useCurrentUser();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      if (userLoading) return;

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      if (role !== 'instructor') {
        router.push('/dashboard');
        return;
      }

      // 통계 데이터 가져오기
      const supabase = getSupabaseBrowserClient();
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .returns<CourseRow[]>();

      if (courses) {
        const totalStudents = courses.reduce((sum, course) =>
          sum + ((course as any).enrollments?.[0]?.count || 0), 0);

        setStats({
          totalCourses: courses.length,
          totalStudents,
          pendingSubmissions: 0, // TODO: 실제 미채점 제출물 수 계산
        });
      }
    };

    loadStats();
  }, [user, role, userLoading, router]);

  if (userLoading || !user || role !== 'instructor') {
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
        <h1 className="text-3xl font-bold">강사 대시보드</h1>
        <p className="text-muted-foreground mt-2">코스와 학습자를 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 개설 코스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 수강생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              미채점 제출물
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}개</div>
          </CardContent>
        </Card>
      </div>

      <InstructorDashboard />
    </div>
  );
}