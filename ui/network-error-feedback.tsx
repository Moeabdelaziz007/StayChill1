import React from 'react';
import { AlertTriangle, AlertCircle, Wifi, Clock, RefreshCw, ShieldAlert } from 'lucide-react';
import { NetworkErrorType } from './network-error-types';
import { Button } from '@/components/ui/button';

interface NetworkErrorFeedbackProps {
  type: NetworkErrorType;
  message: string | null;
  onRetry?: () => void;
  className?: string;
}

// استخدام دالة getErrorMessage من ملف network-error-types
import { getErrorMessage } from './network-error-types';

// الأيقونات المناسبة لكل نوع من أنواع الأخطاء
const getErrorIcon = (type: NetworkErrorType): React.ReactNode => {
  switch (type) {
    case 'connection':
      return <Wifi className="h-6 w-6 text-red-500" />;
    case 'server':
      return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    case 'request':
      return <AlertCircle className="h-6 w-6 text-orange-500" />;
    case 'unauthorized':
      return <ShieldAlert className="h-6 w-6 text-red-500" />;
    case 'timeout':
      return <Clock className="h-6 w-6 text-blue-500" />;
    case 'unknown':
    default:
      return <AlertCircle className="h-6 w-6 text-red-500" />;
  }
};

// ألوان الخلفية المناسبة لكل نوع من أنواع الأخطاء
const getBackgroundClass = (type: NetworkErrorType): string => {
  switch (type) {
    case 'connection':
      return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800';
    case 'server':
      return 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800';
    case 'request':
      return 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800';
    case 'unauthorized':
      return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800';
    case 'timeout':
      return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
    case 'unknown':
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800';
  }
};

/**
 * مكون NetworkErrorFeedback - يعرض رسائل خطأ الشبكة بشكل جذاب
 * يدعم أنواع أخطاء مختلفة (المصادقة، الشبكة، الخادم، الخ)
 */
const NetworkErrorFeedback: React.FC<NetworkErrorFeedbackProps> = ({ 
  type, 
  message, 
  onRetry,
  className = '',
}) => {
  const finalMessage = message || getErrorMessage(type);
  
  return (
    <div className={`rounded-lg p-4 shadow-md ${getBackgroundClass(type)} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon(type)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-right">
            {type === 'connection' && 'خطأ في الاتصال'}
            {type === 'server' && 'خطأ في الخادم'}
            {type === 'request' && 'خطأ في الطلب'}
            {type === 'unauthorized' && 'غير مصرح به'}
            {type === 'timeout' && 'انتهاء المهلة'}
            {type === 'unknown' && 'خطأ غير معروف'}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-right">
            {finalMessage}
          </p>
          {onRetry && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="flex items-center gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                إعادة المحاولة
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkErrorFeedback;