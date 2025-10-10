'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 리포팅 서비스로 전송)
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">오류가 발생했습니다</CardTitle>
          <CardDescription>
            요청을 처리하는 중 문제가 발생했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요.
            </AlertDescription>
          </Alert>

          {error.digest && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                오류 ID: <code className="font-mono bg-muted px-1 py-0.5 rounded">{error.digest}</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                지원팀에 문의하실 때 이 ID를 알려주세요
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => reset()}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                홈으로
              </Button>
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                개발자 정보 (개발 모드에서만 표시)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}