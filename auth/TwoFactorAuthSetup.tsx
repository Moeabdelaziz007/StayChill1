import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Smartphone, LockKeyhole, AlertTriangle, Check, X } from 'lucide-react';

import {
  is2FAAvailable,
  is2FAEnabled,
  getEnrolledFactors,
  createRecaptchaVerifier,
  startPhoneMFAEnrollment,
  completePhoneMFAEnrollment,
  startTOTPMFAEnrollment,
  completeTOTPMFAEnrollment,
  unenrollFactor,
  shouldEnforce2FA
} from '@/lib/firebase';
import type { MultiFactorInfo } from 'firebase/auth';

interface TwoFactorAuthSetupProps {
  userRole: string;
}

export function TwoFactorAuthSetup({ userRole }: TwoFactorAuthSetupProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolledFactors, setEnrolledFactors] = useState<MultiFactorInfo[]>([]);
  const [is2faAvailable, setIs2faAvailable] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [isEnforced, setIsEnforced] = useState(false);
  
  // التحقق بخطوتين عبر الهاتف
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerificationId, setPhoneVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const [isPhoneEnrolling, setIsPhoneEnrolling] = useState(false);
  
  // التحقق بخطوتين عبر تطبيق المصادقة
  const [totpSecret, setTotpSecret] = useState<any>(null);
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isTotpGenerating, setIsTotpGenerating] = useState(false);
  const [isTotpEnrolling, setIsTotpEnrolling] = useState(false);
  
  // حذف عامل
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        
        // التحقق مما إذا كان التحقق بخطوتين متاحًا
        const available = await is2FAAvailable();
        setIs2faAvailable(available);
        
        // التحقق مما إذا كان التحقق بخطوتين مفعلًا
        const enabled = await is2FAEnabled();
        setIs2faEnabled(enabled);
        
        // التحقق مما إذا كان التحقق بخطوتين مطلوبًا لهذا الدور
        const enforced = shouldEnforce2FA(userRole);
        setIsEnforced(enforced);
        
        // جلب العوامل المسجلة
        if (enabled) {
          const factors = await getEnrolledFactors();
          setEnrolledFactors(factors);
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error);
        toast({
          title: t('twoFactor.errorCheckingStatus'),
          description: (error as Error).message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
  }, [t, toast, userRole]);
  
  // بدء عملية التحقق من رقم الهاتف
  const handleStartPhoneVerification = async () => {
    try {
      setIsPhoneVerifying(true);
      
      // إنشاء عنصر reCAPTCHA مؤقت إذا لم يكن موجودًا
      if (!document.getElementById('recaptcha-container')) {
        const div = document.createElement('div');
        div.id = 'recaptcha-container';
        document.body.appendChild(div);
      }
      
      const recaptchaVerifier = createRecaptchaVerifier('recaptcha-container');
      
      // بدء عملية التحقق
      const { verificationId } = await startPhoneMFAEnrollment(phoneNumber, recaptchaVerifier);
      setPhoneVerificationId(verificationId);
      
      toast({
        title: t('twoFactor.codeSent'),
        description: t('twoFactor.codeSentToPhone', { phone: phoneNumber }),
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: t('twoFactor.errorSendingCode'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsPhoneVerifying(false);
      
      // إزالة عنصر reCAPTCHA المؤقت
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.remove();
      }
    }
  };
  
  // إكمال عملية تسجيل رقم الهاتف
  const handleCompletePhoneEnrollment = async () => {
    try {
      setIsPhoneEnrolling(true);
      
      await completePhoneMFAEnrollment(
        phoneVerificationId,
        verificationCode,
        'Phone Authentication'
      );
      
      // تحديث الحالة
      setIs2faEnabled(true);
      const factors = await getEnrolledFactors();
      setEnrolledFactors(factors);
      
      // إعادة تعيين الحقول
      setPhoneNumber('');
      setVerificationCode('');
      setPhoneVerificationId('');
      
      toast({
        title: t('twoFactor.setupSuccess'),
        description: t('twoFactor.phoneSetupSuccess'),
      });
    } catch (error) {
      console.error('Error enrolling phone:', error);
      toast({
        title: t('twoFactor.setupError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsPhoneEnrolling(false);
    }
  };
  
  // بدء عملية إعداد تطبيق المصادقة (TOTP)
  const handleStartTotpSetup = async () => {
    try {
      setIsTotpGenerating(true);
      
      // إنشاء السر
      const secret = await startTOTPMFAEnrollment();
      setTotpSecret(secret);
      
      // إنشاء QR Code URL
      const qrCodeUrl = secret.qrCodeUrl;
      setTotpQrCode(qrCodeUrl);
      
      toast({
        title: t('twoFactor.totpReady'),
        description: t('twoFactor.scanQrCode'),
      });
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      toast({
        title: t('twoFactor.totpGenerationError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsTotpGenerating(false);
    }
  };
  
  // إكمال عملية إعداد تطبيق المصادقة
  const handleCompleteTotpEnrollment = async () => {
    try {
      setIsTotpEnrolling(true);
      
      await completeTOTPMFAEnrollment(
        totpSecret,
        totpCode,
        'Authenticator App'
      );
      
      // تحديث الحالة
      setIs2faEnabled(true);
      const factors = await getEnrolledFactors();
      setEnrolledFactors(factors);
      
      // إعادة تعيين الحقول
      setTotpSecret(null);
      setTotpQrCode('');
      setTotpCode('');
      
      toast({
        title: t('twoFactor.setupSuccess'),
        description: t('twoFactor.totpSetupSuccess'),
      });
    } catch (error) {
      console.error('Error enrolling TOTP:', error);
      toast({
        title: t('twoFactor.setupError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsTotpEnrolling(false);
    }
  };
  
  // إلغاء تسجيل عامل المصادقة
  const handleUnenrollFactor = async (uid: string) => {
    try {
      setIsUnenrolling(true);
      
      await unenrollFactor(uid);
      
      // تحديث الحالة
      const factors = await getEnrolledFactors();
      setEnrolledFactors(factors);
      setIs2faEnabled(factors.length > 0);
      
      toast({
        title: t('twoFactor.factorRemoved'),
        description: t('twoFactor.factorRemovedSuccess'),
      });
    } catch (error) {
      console.error('Error removing factor:', error);
      toast({
        title: t('twoFactor.removeError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsUnenrolling(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!is2faAvailable) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('twoFactor.notAvailable')}</AlertTitle>
        <AlertDescription>
          {t('twoFactor.notAvailableDesc')}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t('twoFactor.title')}
        </CardTitle>
        <CardDescription>
          {t('twoFactor.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* الحالة الحالية */}
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
          <div className={`rounded-full p-2 ${is2faEnabled ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {is2faEnabled ? <Check className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <p className="font-medium">
              {is2faEnabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
            </p>
            <p className="text-sm text-muted-foreground">
              {is2faEnabled 
                ? t('twoFactor.enabledDesc') 
                : isEnforced 
                  ? t('twoFactor.enforcedDesc') 
                  : t('twoFactor.disabledDesc')}
            </p>
          </div>
        </div>
        
        {/* عوامل المصادقة المسجلة */}
        {is2faEnabled && enrolledFactors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">{t('twoFactor.enrolledFactors')}</h3>
            {enrolledFactors.map((factor) => (
              <div key={factor.uid} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  {factor.factorId === 'phone' ? (
                    <Smartphone className="h-5 w-5 text-primary" />
                  ) : (
                    <LockKeyhole className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{factor.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {factor.factorId === 'phone' ? t('twoFactor.phoneFactor') : t('twoFactor.appFactor')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnenrollFactor(factor.uid)}
                  disabled={isUnenrolling || (isEnforced && enrolledFactors.length === 1)}
                >
                  {isUnenrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t('twoFactor.remove')}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* إضافة عامل مصادقة جديد */}
        {(!is2faEnabled || enrolledFactors.length < 2) && (
          <Tabs defaultValue="phone">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="phone">{t('twoFactor.phoneTab')}</TabsTrigger>
              <TabsTrigger value="app">{t('twoFactor.appTab')}</TabsTrigger>
            </TabsList>
            
            {/* التحقق عبر الهاتف */}
            <TabsContent value="phone" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone-number">{t('twoFactor.phoneNumber')}</Label>
                <Input
                  id="phone-number"
                  placeholder="+201234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!!phoneVerificationId || isPhoneVerifying}
                />
                <p className="text-xs text-muted-foreground">
                  {t('twoFactor.phoneNumberFormat')}
                </p>
              </div>
              
              {!phoneVerificationId ? (
                <Button
                  onClick={handleStartPhoneVerification}
                  disabled={!phoneNumber || isPhoneVerifying}
                  className="w-full"
                >
                  {isPhoneVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t('twoFactor.sendCode')}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">{t('twoFactor.verificationCode')}</Label>
                    <Input
                      id="verification-code"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isPhoneEnrolling}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhoneVerificationId('');
                        setVerificationCode('');
                      }}
                      disabled={isPhoneEnrolling}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={handleCompletePhoneEnrollment}
                      disabled={!verificationCode || isPhoneEnrolling}
                      className="flex-1"
                    >
                      {isPhoneEnrolling ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t('twoFactor.verify')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* التحقق عبر تطبيق المصادقة */}
            <TabsContent value="app" className="space-y-4 mt-4">
              {!totpQrCode ? (
                <div className="space-y-4">
                  <p className="text-sm">
                    {t('twoFactor.appDescription')}
                  </p>
                  <Button
                    onClick={handleStartTotpSetup}
                    disabled={isTotpGenerating}
                    className="w-full"
                  >
                    {isTotpGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t('twoFactor.setupApp')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="border p-4 rounded-lg">
                      {/* عرض رمز QR */}
                      <img
                        src={totpQrCode}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {t('twoFactor.scanQrCodeInstructions')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totp-code">{t('twoFactor.enterCode')}</Label>
                    <Input
                      id="totp-code"
                      placeholder="123456"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      disabled={isTotpEnrolling}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTotpSecret(null);
                        setTotpQrCode('');
                        setTotpCode('');
                      }}
                      disabled={isTotpEnrolling}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={handleCompleteTotpEnrollment}
                      disabled={!totpCode || isTotpEnrolling}
                      className="flex-1"
                    >
                      {isTotpEnrolling ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t('twoFactor.verify')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {/* تحذير للمستخدمين ذوي الأدوار الحساسة */}
        {isEnforced && !is2faEnabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('twoFactor.requiredTitle')}</AlertTitle>
            <AlertDescription>
              {t('twoFactor.requiredDesc')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-6">
        <p className="text-xs text-muted-foreground">
          {t('twoFactor.securityNote')}
        </p>
      </CardFooter>
    </Card>
  );
}