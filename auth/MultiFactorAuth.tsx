import { useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { 
  RecaptchaVerifier, 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator 
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MultiFactorAuthProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MultiFactorAuth({ onComplete, onCancel }: MultiFactorAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  // Initialize reCAPTCHA when component mounts
  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow user to continue
        },
        'expired-callback': () => {
          // Reset the reCAPTCHA
          setError('reCAPTCHA has expired. Please solve it again.');
        }
      });
    }
  };
  
  // Handle sending the verification code to the phone
  const handleSendCode = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      setupRecaptcha();
      
      // Start the MFA enrollment process
      const multiFactorSession = await multiFactor(auth.currentUser).getSession();
      
      // Send the SMS verification code
      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession
      };
      
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        recaptchaVerifierRef.current!
      );
      
      setVerificationId(verificationId);
      setLoading(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
      setLoading(false);
    }
  };
  
  // Handle verifying the code and enrolling the second factor
  const handleVerifyCode = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (!auth.currentUser || !verificationId) {
        throw new Error('Missing required information');
      }
      
      // Create credential with the verification code
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      // Enroll the second factor
      await multiFactor(auth.currentUser).enroll(multiFactorAssertion, 'Phone Number');
      
      setLoading(false);
      if (onComplete) onComplete();
    } catch (error: any) {
      setError(error.message || 'Failed to verify code');
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by using your phone as a second factor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!verificationId ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <Input
                type="tel"
                placeholder="+201234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include country code (e.g., +20 for Egypt)
              </p>
            </div>
            <div id="recaptcha-container" className="mb-4"></div>
          </>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Verification Code</label>
            <Input
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to your phone
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        {!verificationId ? (
          <Button onClick={handleSendCode} disabled={!phoneNumber || loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </Button>
        ) : (
          <Button onClick={handleVerifyCode} disabled={!verificationCode || loading}>
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Component to handle MFA sign-in when prompted
interface MFASignInProps {
  resolver: any;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFASignIn({ resolver, onComplete, onCancel }: MFASignInProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  // Initialize reCAPTCHA when component mounts
  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
      });
    }
  };
  
  // Handle verifying the code for sign-in
  const handleVerifyCode = async () => {
    try {
      setError(null);
      setLoading(true);
      
      setupRecaptcha();
      
      // Get the phone info
      const hints = resolver.hints;
      const firstHint = hints[0]; // Assuming the first hint is phone
      
      // Create a credential with the verification code
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber: firstHint.phoneNumber, session: resolver.session },
        recaptchaVerifierRef.current!
      );
      
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      // Complete sign-in with second factor
      await resolver.resolveSignIn(multiFactorAssertion);
      
      setLoading(false);
      if (onComplete) onComplete();
    } catch (error: any) {
      setError(error.message || 'Failed to verify code');
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication Required</CardTitle>
        <CardDescription>
          Please verify your identity with the second factor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Verification Code</label>
          <Input
            type="text"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code sent to your phone
          </p>
        </div>
        <div id="recaptcha-container" className="mb-4"></div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleVerifyCode} disabled={!verificationCode || loading}>
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </Button>
      </CardFooter>
    </Card>
  );
}