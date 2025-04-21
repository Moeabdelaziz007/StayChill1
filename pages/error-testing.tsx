import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNetworkError } from '@/contexts/network-error-context';
import { NetworkErrorType } from '@/components/ui/network-error-types';
import { AlertTriangle, Clock, ShieldAlert, Wifi, AlertCircle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ApiErrorBoundary from '@/components/error-handling/api-error-boundary';

/**
 * صفحة لاختبار نظام عرض أخطاء الشبكة
 * تسمح للمطورين باختبار كل أنواع الأخطاء وكيفية ظهورها للمستخدم
 */
const ErrorTesting: React.FC = () => {
  const { showError } = useNetworkError();
  const [customMessage, setCustomMessage] = useState<string>('');
  const [useCustomMessage, setUseCustomMessage] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(1);
  
  // أنواع الأخطاء المتاحة للاختبار
  const errorTypes: { type: NetworkErrorType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      type: 'connection',
      label: 'خطأ اتصال',
      icon: <Wifi className="h-5 w-5" />,
      description: 'محاكاة خطأ انقطاع الاتصال بالإنترنت أو الشبكة'
    },
    {
      type: 'server',
      label: 'خطأ في الخادم',
      icon: <AlertTriangle className="h-5 w-5" />,
      description: 'محاكاة خطأ من جانب الخادم (5xx)'
    },
    {
      type: 'request',
      label: 'خطأ في الطلب',
      icon: <AlertCircle className="h-5 w-5" />,
      description: 'محاكاة خطأ في طلب العميل (4xx)'
    },
    {
      type: 'unauthorized',
      label: 'غير مصرح',
      icon: <ShieldAlert className="h-5 w-5" />,
      description: 'محاكاة خطأ المصادقة أو عدم وجود صلاحيات (401/403)'
    },
    {
      type: 'timeout',
      label: 'انتهاء المهلة',
      icon: <Clock className="h-5 w-5" />,
      description: 'محاكاة خطأ انتهاء وقت الاستجابة'
    },
    {
      type: 'unknown',
      label: 'خطأ غير معروف',
      icon: <AlertCircle className="h-5 w-5" />,
      description: 'محاكاة خطأ غير محدد أو غير معروف'
    }
  ];
  
  // عرض الخطأ المحدد باستخدام NetworkErrorContext
  const displayError = (type: NetworkErrorType) => {
    const message = useCustomMessage ? customMessage : null;
    showError(type, message, () => console.log('إعادة المحاولة للخطأ:', type));
  };
  
  // محاكاة طلب API فاشل بتأخير محدد
  const simulateFailedApiCall = (errorType: NetworkErrorType): Promise<any> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        // محاكاة الاستجابة بناءً على نوع الخطأ
        let error: any = new Error('خطأ محاكى للاختبار');
        
        if (errorType === 'server') {
          error.status = 500;
        } else if (errorType === 'request') {
          error.status = 400;
        } else if (errorType === 'unauthorized') {
          error.status = 401;
        } else if (errorType === 'timeout') {
          error.name = 'AbortError';
        }
        
        reject(error);
      }, 1000);
    });
  };

  // محاكاة طلب API ناجح
  const simulateSuccessfulApiCall = (): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'تم تنفيذ الطلب بنجاح' });
      }, 1000);
    });
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">اختبار نظام عرض أخطاء الشبكة</h1>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        هذه الصفحة مخصصة لاختبار عرض أنواع مختلفة من أخطاء الشبكة وكيفية تفاعل المستخدم معها
      </p>
      
      <Tabs defaultValue="manual" className="w-full mb-12">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="manual">عرض الأخطاء يدويًا</TabsTrigger>
          <TabsTrigger value="api">محاكاة طلبات API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {errorTypes.map((errorType) => (
              <Card key={errorType.type} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {errorType.icon}
                    <CardTitle>{errorType.label}</CardTitle>
                  </div>
                  <CardDescription>{errorType.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                    <Switch
                      id={`custom-message-${errorType.type}`}
                      checked={useCustomMessage}
                      onCheckedChange={setUseCustomMessage}
                    />
                    <Label htmlFor={`custom-message-${errorType.type}`}>رسالة مخصصة</Label>
                  </div>
                  
                  {useCustomMessage && (
                    <Input 
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="أدخل رسالة الخطأ المخصصة"
                      className="mb-4"
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="default" 
                    className="w-full" 
                    onClick={() => displayError(errorType.type)}
                  >
                    عرض الخطأ
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="api">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>اختبار ApiErrorBoundary</CardTitle>
                <CardDescription>اختبار مكون ApiErrorBoundary مع استراتيجية إعادة المحاولة التلقائية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>نوع الخطأ</Label>
                    <select 
                      className="w-full p-2 mt-1 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      value={errorTypes[0].type}
                      onChange={() => {}}
                    >
                      {errorTypes.map(type => (
                        <option key={type.type} value={type.type}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>عدد المحاولات</Label>
                    <div className="flex items-center mt-1">
                      <Input 
                        type="number" 
                        min={1} 
                        max={5}
                        value={retryCount}
                        onChange={(e) => setRetryCount(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-4 mt-4">
                    <ApiErrorBoundary
                      apiRequest={() => simulateFailedApiCall('server')}
                      errorMessage="فشل جلب البيانات من الخادم. يرجى المحاولة مرة أخرى."
                      maxRetries={retryCount}
                      onSuccess={(data) => console.log('نجاح:', data)}
                      onError={(error) => console.error('خطأ:', error)}
                      onRetrying={(attempt) => console.log(`محاولة إعادة رقم ${attempt}`)}
                    >
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          هذا المكون سيحاول تنفيذ طلب API فاشل وسيعرض خطأ
                        </p>
                      </div>
                    </ApiErrorBoundary>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>طلب API ناجح</CardTitle>
                <CardDescription>اختبار ApiErrorBoundary مع طلب ناجح</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiErrorBoundary
                  apiRequest={simulateSuccessfulApiCall}
                  errorMessage="حدث خطأ ما"
                  maxRetries={1}
                >
                  {(data) => (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-green-800 dark:text-green-200">تم تنفيذ الطلب بنجاح</p>
                      <pre className="mt-2 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}
                </ApiErrorBoundary>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>توثيق النظام</CardTitle>
                <CardDescription>معلومات حول نظام إدارة الأخطاء وكيفية استخدامه</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    نظام إدارة أخطاء الشبكة يتكون من عدة مكونات رئيسية:
                  </p>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">1. NetworkErrorContext</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      سياق React لإدارة حالة الأخطاء في جميع أنحاء التطبيق
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">2. NetworkErrorContainer</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      مكون يعرض رسائل الخطأ في أعلى الشاشة
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">3. NetworkErrorFeedback</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      مكون العرض المرئي لرسائل الخطأ مع أيقونات ورسائل متخصصة لكل نوع
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">4. ApiErrorBoundary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      مكون غلاف مع دعم لإعادة المحاولة التلقائية للطلبات الفاشلة
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">5. استراتيجية إعادة المحاولة</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      منطق إعادة المحاولة مع تراجع أسي لتحسين تجربة المستخدم
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorTesting;