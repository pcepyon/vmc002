'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Home,
  Plus,
  BarChart
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const [userRole, setUserRole] = useState<'learner' | 'instructor' | null>(null);

  // 사용자 역할 가져오기
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserRole((data as any).role as 'learner' | 'instructor');
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 및 브랜드 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6" />
            <span>LMS Platform</span>
          </Link>

          {/* 메인 네비게이션 - IA 문서에 따라 수정 */}
          <nav className="hidden md:flex items-center gap-4">
            {/* 로그인하지 않은 사용자 */}
            {!isAuthenticated && (
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === '/'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  홈
                </Link>
                <Link
                  href="/courses"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/courses')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  코스 탐색
                </Link>
              </>
            )}

            {/* 학습자 네비게이션 */}
            {isAuthenticated && userRole === 'learner' && (
              <>
                <Link
                  href="/dashboard/learner"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/dashboard/learner')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    대시보드
                  </div>
                </Link>
                <Link
                  href="/my-courses"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/my-courses')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    내 코스
                  </div>
                </Link>
                <Link
                  href="/courses"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/courses')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  코스 탐색
                </Link>
              </>
            )}

            {/* 강사 네비게이션 */}
            {isAuthenticated && userRole === 'instructor' && (
              <>
                <Link
                  href="/dashboard/instructor"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/dashboard/instructor')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    대시보드
                  </div>
                </Link>
                <Link
                  href="/manage/courses"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/manage/courses')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    코스 관리
                  </div>
                </Link>
                <Link
                  href="/manage/courses/new"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/manage/courses/new')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    코스 생성
                  </div>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">로딩 중...</div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium">{user.email?.split('@')[0]}</div>
                      <div className="text-xs text-gray-500">
                        {userRole === 'instructor' ? '강사' : '학습자'}
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* 역할별 대시보드 링크 */}
                <DropdownMenuItem asChild>
                  <Link
                    href={userRole === 'instructor' ? '/dashboard/instructor' : '/dashboard/learner'}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    대시보드
                  </Link>
                </DropdownMenuItem>

                {/* 학습자 전용 메뉴 */}
                {userRole === 'learner' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-courses" className="flex items-center gap-2 cursor-pointer">
                        <BookOpen className="h-4 w-4" />
                        내 코스
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/courses" className="flex items-center gap-2 cursor-pointer">
                        <GraduationCap className="h-4 w-4" />
                        코스 탐색
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* 강사 전용 메뉴 */}
                {userRole === 'instructor' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/manage/courses" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        코스 관리
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/manage/courses/new" className="flex items-center gap-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        새 코스 생성
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/manage/analytics" className="flex items-center gap-2 cursor-pointer">
                        <BarChart className="h-4 w-4" />
                        분석
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* 프로필 */}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    프로필
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 로그아웃 */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}