import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage, isApiError, formatErrorMessage } from '@/lib/errors/error-utils';
import { ErrorCode } from '@/backend/middleware/error';

export const useErrorToast = () => {
  const { toast } = useToast();

  const showError = (error: any, customMessage?: string) => {
    const message = customMessage || formatErrorMessage(error);
    const isRetryable = isApiError(error) && error.error.code === ErrorCode.RATE_LIMIT;

    toast({
      variant: 'destructive',
      title: '오류',
      description: message,
      // ToastAction은 JSX를 사용하기 때문에 컴포넌트에서 직접 사용해야 함
      // 여기서는 단순한 메시지만 표시
    });

    // 재시도 가능한 경우 별도 토스트
    if (isRetryable) {
      setTimeout(() => {
        toast({
          title: '재시도',
          description: '잠시 후 다시 시도해주세요.',
        });
      }, 1000);
    }
  };

  const showSuccess = (message: string) => {
    toast({
      title: '성공',
      description: message,
    });
  };

  const showInfo = (message: string) => {
    toast({
      title: '알림',
      description: message,
    });
  };

  return {
    showError,
    showSuccess,
    showInfo,
  };
};