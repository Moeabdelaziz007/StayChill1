import React, { createContext, useState, useContext, ReactNode } from 'react';
import { NetworkErrorType } from '@/components/ui/network-error-types';

interface NetworkErrorState {
  isVisible: boolean;
  type: NetworkErrorType;
  message: string | null;
  onRetry: (() => void) | null;
}

interface NetworkErrorContextType {
  errorState: NetworkErrorState;
  showError: (type: NetworkErrorType, message: string | null, onRetry?: () => void) => void;
  hideError: () => void;
}

const initialErrorState: NetworkErrorState = {
  isVisible: false,
  type: 'unknown',
  message: null,
  onRetry: null
};

export const NetworkErrorContext = createContext<NetworkErrorContextType | null>(null);

export const NetworkErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errorState, setErrorState] = useState<NetworkErrorState>(initialErrorState);

  /**
   * عرض خطأ الشبكة
   * @param type نوع الخطأ
   * @param message نص رسالة الخطأ 
   * @param onRetry وظيفة تنفذ عند النقر على زر إعادة المحاولة
   */
  const showError = (type: NetworkErrorType, message: string | null, onRetry?: () => void) => {
    setErrorState({
      isVisible: true,
      type,
      message,
      onRetry: onRetry || null
    });
  };

  /**
   * إخفاء خطأ الشبكة
   */
  const hideError = () => {
    setErrorState({
      ...errorState,
      isVisible: false
    });
  };

  return (
    <NetworkErrorContext.Provider value={{ errorState, showError, hideError }}>
      {children}
    </NetworkErrorContext.Provider>
  );
};

/**
 * استخدام دالة مختصرة للوصول لسياق أخطاء الشبكة
 */
export const useNetworkError = () => {
  const context = useContext(NetworkErrorContext);
  if (!context) {
    throw new Error('useNetworkError must be used within a NetworkErrorProvider');
  }
  return context;
};