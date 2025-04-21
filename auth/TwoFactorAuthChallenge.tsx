import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, KeyRound } from 'lucide-react';
import { 
  getAuth, 
  MultiFactorResolver, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator,
  RecaptchaVerifier
} from 'firebase/auth';
// استيراد وظيفة إنشاء RecaptchaVerifier الخاصة بنا التي تحتوي على إعدادات صحيحة
import { createRecaptchaVerifier } from '@/lib/firebase';

interface TwoFactorAuthChallengeProps {
  resolver: MultiFactorResolver;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorAuthChallenge({ resolver, onSuccess, onCancel }: TwoFactorAuthChallengeProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  
  const auth = getAuth();
  const hints = resolver.hints;
  
  // معالجة إدخال المستخدم
  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      
      let credential;
      
      // التحقق إذا كان العامل هو TOTP (تطبيق المصادقة)
      if (hints[0].factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        // إنشاء اعتماد TOTP
        // هناك خطأ في استخدام TotpMultiFactorGenerator.assertionForSignIn
        // وأيضا استخدام TotpMultiFactorGenerator.assertion مباشرة ليس صحيحًا
        const cred = TotpMultiFactorGenerator.generateCredential(verificationCode);
        credential = TotpMultiFactorGenerator.assertion(cred);
      } 
      // التحقق إذا كان العامل هو SMS (هاتف)
      else if (hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
        credential = PhoneMultiFactorGenerator.assertion(cred);
      }
      
      if (!credential) {
        throw new Error('No supported factor found');
      }
      
      // إكمال تسجيل الدخول
      await resolver.resolveSignIn(credential);
      
      toast({
        title: t('twoFactor.loginSuccessful'),
        description: t('twoFactor.verificationComplete'),
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error completing multi-factor challenge:', error);
      toast({
        title: t('twoFactor.verificationFailed'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // طلب رمز التحقق إذا كان النوع هو رسالة نصية
  const handleSendVerificationCode = async () => {
    try {
      setIsSendingCode(true);
      
      // تأكد من أن العامل هو هاتف
      if (hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        // إنشاء عنصر reCAPTCHA مؤقت إذا لم يكن موجودًا
        if (!document.getElementById('recaptcha-container')) {
          const div = document.createElement('div');
          div.id = 'recaptcha-container';
          document.body.appendChild(div);
        }
        
        // إنشاء مثيل جديد من مزود المصادقة عبر الهاتف
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        
        // طلب رمز التحقق
        // استخدام وظيفة إنشاء RecaptchaVerifier الخاصة بنا
        const recaptchaVerifier = createRecaptchaVerifier('recaptcha-container');
        
        const verId = await phoneAuthProvider.verifyPhoneNumber({
          multiFactorHint: hints[0],
          session: resolver.session
        }, recaptchaVerifier);
        
        setVerificationId(verId);
        
        toast({
          title: t('twoFactor.codeSent'),
          description: t('twoFactor.enterReceivedCode'),
        });
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: t('twoFactor.errorSendingCode'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingCode(false);
      
      // إزالة عنصر reCAPTCHA المؤقت
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.remove();
      }
    }
  };
  
  const isTotpFactor = hints[0]?.factorId === TotpMultiFactorGenerator.FACTOR_ID;
  const isPhoneFactor = hints[0]?.factorId === PhoneMultiFactorGenerator.FACTOR_ID;
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t('twoFactor.verificationRequired')}
        </CardTitle>
        <CardDescription>
          {isTotpFactor 
            ? t('twoFactor.enterAuthenticatorCode')
            : isPhoneFactor
              ? t('twoFactor.enterSmsCode')
              : t('twoFactor.additionalVerificationNeeded')
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* عرض معلومات العامل */}
        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
          <KeyRound className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">
              {hints[0]?.displayName || t('twoFactor.securityFactor')}
            </p>
            <p className="text-xs text-muted-foreground">
              {isTotpFactor 
                ? t('twoFactor.useAuthApp')
                : isPhoneFactor
                  ? t('twoFactor.useSms', { phone: hints[0]?.phoneNumber || '' })
                  : t('twoFactor.followInstructions')
              }
            </p>
          </div>
        </div>
        
        {/* عرض زر طلب الرمز لعوامل الهاتف */}
        {isPhoneFactor && !verificationId && (
          <Button
            onClick={handleSendVerificationCode}
            disabled={isSendingCode}
            className="w-full"
          >
            {isSendingCode ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t('twoFactor.sendVerificationCode')}
          </Button>
        )}
        
        {/* حقل إدخال الرمز */}
        {(isTotpFactor || (isPhoneFactor && verificationId)) && (
          <div className="space-y-2">
            <Label htmlFor="verification-code">
              {t('twoFactor.verificationCode')}
            </Label>
            <Input
              id="verification-code"
              placeholder={isTotpFactor ? '123456' : '- - - - - -'}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isLoading}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              {isTotpFactor
                ? t('twoFactor.fromAuthApp')
                : t('twoFactor.fromSms')
              }
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleVerifyCode}
          disabled={!verificationCode || isLoading || (isPhoneFactor && !verificationId)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {t('twoFactor.verify')}
        </Button>
      </CardFooter>
    </Card>
  );
}