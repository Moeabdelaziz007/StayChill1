import React, { useEffect, useRef, useCallback } from 'react';
import { useNetworkError } from '@/contexts/network-error-context';
import NetworkErrorFeedback from './network-error-feedback';
import { X } from 'lucide-react';

/**
 * مكون حاوية أخطاء الشبكة
 * يتم وضعه في الطبقة العليا من التطبيق وهو يستخدم سياق الأخطاء لعرض وإخفاء رسائل الخطأ
 */
const NetworkErrorContainer: React.FC = () => {
  const { errorState, hideError } = useNetworkError();
  const containerRef = useRef<HTMLDivElement>(null);

  // وظيفة إغلاق رسالة الخطأ عند الضغط على زر Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && errorState.isVisible) {
      hideError();
    }
  }, [errorState.isVisible, hideError]);

  // تسجيل المستمع للـ Escape key عند ظهور الخطأ
  useEffect(() => {
    if (errorState.isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [errorState.isVisible, handleKeyDown]);

  // عرض الحاوية فقط عندما يكون هناك خطأ مرئي
  if (!errorState.isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-4 z-50 flex items-center justify-center px-4 pointer-events-none"
      aria-live="assertive"
    >
      <div className="w-full max-w-md pointer-events-auto relative">
        <button 
          onClick={hideError}
          className="absolute top-1 right-1 p-1 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-transparent"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
        
        <NetworkErrorFeedback 
          type={errorState.type} 
          message={errorState.message} 
          onRetry={errorState.onRetry || undefined}
        />
      </div>
    </div>
  );
};

export default NetworkErrorContainer;