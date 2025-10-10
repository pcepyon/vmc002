'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="mb-6">
            <h1 className="text-8xl font-bold text-primary mb-2">404</h1>
            <h2 className="text-2xl font-semibold mb-4">
              페이지를 찾을 수 없습니다
            </h2>
            <p className="text-muted-foreground mb-8">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전 페이지로
            </Button>

            <Link href="/" className="block">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                홈으로 돌아가기
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              자주 찾는 페이지
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              <Link
                href="/courses"
                className="text-primary hover:underline transition-colors"
              >
                코스 목록
              </Link>
              <Link
                href="/dashboard"
                className="text-primary hover:underline transition-colors"
              >
                대시보드
              </Link>
              <Link
                href="/auth/signin"
                className="text-primary hover:underline transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/help"
                className="text-primary hover:underline transition-colors"
              >
                도움말
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}