'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  className = ''
}: ErrorFallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류가 발생했습니다</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'}
        </AlertDescription>
      </Alert>

      <Button
        onClick={resetErrorBoundary}
        variant="outline"
        className="mt-4"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        다시 시도
      </Button>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 max-w-md w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            개발자 정보
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}