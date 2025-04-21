import React, { useState, useEffect, ReactNode } from 'react';
import { useNetworkError } from '@/contexts/network-error-context';
import { NetworkErrorType, determineErrorType } from '@/components/ui/network-error-types';
import { RetryStrategy, createRetryStrategy } from '@/lib/retry-request';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  apiRequest: () => Promise<any>;
  errorMessage?: string;
  maxRetries?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onRetrying?: (attempt: number) => void;
  errorType?: NetworkErrorType;
  suspense?: boolean;
}

/**
 * مكون ApiErrorBoundary - مكون غلاف للتعامل مع أخطاء واجهة API
 * 
 * يقوم هذا المكون بما يلي:
 * - استدعاء واجهة برمجة التطبيقات المحددة
 * - إدارة حالة التحميل والأخطاء
 * - عرض رسائل خطأ مناسبة عن طريق سياق NetworkError
 * - تنفيذ منطق إعادة المحاولة مع استراتيجية التراجع الأسي
 */
const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({
  children,
  fallback,
  apiRequest,
  errorMessage,
  maxRetries = 3,
  onSuccess,
  onError,
  onRetrying,
  errorType: predefinedErrorType,
  suspense = false,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [retryStrategy, setRetryStrategy] = useState<RetryStrategy | null>(null);
  const { showError } = useNetworkError();

  useEffect(() => {
    let mounted = true;
    let retryStrategyInstance: RetryStrategy;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiRequest();
        
        if (mounted) {
          setData(result);
          setLoading(false);
          if (onSuccess) onSuccess(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setLoading(false);
          
          if (onError) onError(err);

          // إذا كان هناك نوع خطأ محدد مسبقًا، استخدمه، وإلا فقم بتحديد نوع الخطأ من الخطأ الفعلي
          const errorType = predefinedErrorType || determineErrorType(err);
          
          // إعداد استراتيجية إعادة المحاولة
          if (!retryStrategy) {
            retryStrategyInstance = createRetryStrategy(maxRetries);
            setRetryStrategy(retryStrategyInstance);
          }
          
          // عرض رسالة الخطأ مع إمكانية إعادة المحاولة
          showError(
            errorType,
            errorMessage || null,
            retryStrategy ? () => retryWithBackoff() : undefined
          );
        }
      }
    };

    const retryWithBackoff = async () => {
      if (!retryStrategy) return;
      
      const shouldRetry = retryStrategy.shouldRetry();
      
      if (shouldRetry) {
        const attempt = retryStrategy.getCurrentAttempt();
        const delay = retryStrategy.getNextDelayMs();
        
        if (onRetrying) onRetrying(attempt);
        
        // عرض رسالة أثناء إعادة المحاولة
        showError(
          'timeout',
          `جاري إعادة المحاولة... (محاولة ${attempt}/${maxRetries})`,
          undefined
        );
        
        // انتظار قبل إعادة المحاولة (استراتيجية التراجع الأسي)
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        // إعادة المحاولة
        fetchData();
      } else {
        console.error('Maximum retry attempts reached');
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [apiRequest, maxRetries]);

  if (loading) {
    if (suspense) {
      throw new Promise((resolve) => setTimeout(resolve, 100));
    }
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 border-2 border-t-primary border-primary/30 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
        <p className="text-red-800 dark:text-red-200 text-sm">حدث خطأ أثناء تحميل البيانات</p>
      </div>
    );
  }

  // تمرير البيانات إلى الأطفال إذا كانوا وظيفة
  if (typeof children === 'function') {
    return children(data);
  }

  return <>{children}</>;
};

export default ApiErrorBoundary;