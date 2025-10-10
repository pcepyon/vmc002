'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCoursesQuery } from '@/features/course/hooks/useCoursesQuery';
import { useEnrollMutation } from '@/features/course/hooks/useEnrollMutation';
import { useCourseFilterStore } from '@/features/course/store/filter';
import { CourseCard } from '@/components/course/card/CourseCard';
import { CourseFilterPanel } from '@/components/filters/CourseFilterPanel';
import { SearchBar } from '@/components/search/SearchBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import type { SortBy } from '@/features/course/lib/dto';
import type { Database } from '@/lib/supabase/types';

type EnrollmentRow = Database['public']['Tables']['enrollments']['Row'];

export default function CoursesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userEnrollments, setUserEnrollments] = useState<string[]>([]);

  const {
    category,
    difficulty,
    searchQuery,
    sortBy,
    page,
    setCategory,
    setDifficulty,
    setSearchQuery,
    setSortBy,
    setPage,
    reset,
    getFilters
  } = useCourseFilterStore();

  const filters = getFilters();
  const { data, isLoading, isError } = useCoursesQuery(filters);
  const enrollMutation = useEnrollMutation();

  // 사용자의 수강 목록 가져오기
  useEffect(() => {
    const fetchEnrollments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .returns<EnrollmentRow[]>();

        if (enrollments) {
          setUserEnrollments(enrollments.map((e) => e.course_id));
        }
      }
    };

    fetchEnrollments();
  }, [supabase]);

  const handleEnroll = async (courseId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    await enrollMutation.mutateAsync(courseId);
    // 수강 목록 업데이트
    setUserEnrollments((prev) => [...prev, courseId]);
  };

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">코스 카탈로그</h1>
        <p className="text-muted-foreground">
          다양한 코스를 탐색하고 학습을 시작하세요
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 사이드바 필터 */}
        <aside className="lg:w-64 shrink-0">
          <CourseFilterPanel
            category={category}
            difficulty={difficulty}
            onCategoryChange={setCategory}
            onDifficultyChange={setDifficulty}
            onReset={reset}
          />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1">
          {/* 검색 및 정렬 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="코스 검색..."
              className="flex-1"
            />
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortBy)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 코스 목록 */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                코스를 불러오는 중 오류가 발생했습니다.
              </p>
            </div>
          ) : !data || data.courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                검색 결과가 없습니다. 필터를 조정해보세요.
              </p>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                }
              >
                {data.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={userEnrollments.includes(course.id)}
                    onEnroll={() => handleEnroll(course.id)}
                    variant={viewMode}
                  />
                ))}
              </div>

              {/* 페이지네이션 */}
              {data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <div className="flex items-center px-4">
                    {page} / {data.pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}