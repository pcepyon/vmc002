import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/constants/env";
import {
  LOGIN_PATH,
  isAuthEntryPath,
  shouldProtectPath,
} from "@/constants/auth";
import { match } from "ts-pattern";

const copyCookies = (from: NextResponse, to: NextResponse) => {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set({
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
    });
  });

  return to;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // 레거시 경로 리다이렉트
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  if (pathname === '/signup') {
    return NextResponse.redirect(new URL('/auth/signup', request.url));
  }

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 공개 경로 목록
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/confirm'
  ];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // 보호된 경로에 미인증 사용자가 접근하는 경우
  if (!user && shouldProtectPath(pathname) && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/signin';
    loginUrl.searchParams.set("redirectTo", pathname);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  // 인증된 사용자가 인증 페이지에 접근하는 경우
  if (user && isPublicRoute) {
    // 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, phone')
      .eq('id', user.id)
      .single();

    // 프로필 미완성 시 온보딩으로
    const profileData = profile as { name?: string; phone?: string; role?: string } | null;
    if (!profileData?.name || !profileData?.phone || !profileData?.role) {
      if (pathname !== '/auth/onboarding') {
        return NextResponse.redirect(new URL('/auth/onboarding', request.url));
      }
    } else {
      // 역할별 대시보드로 리다이렉트
      const dashboardUrl = profileData.role === 'instructor'
        ? '/dashboard/instructor'
        : '/dashboard/learner';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
