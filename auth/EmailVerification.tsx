import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getCurrentUser, sendVerificationEmail, isEmailVerified } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function EmailVerification() {
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setEmailVerified(user.emailVerified);
    }
  }, []);

  const handleSendVerificationEmail = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      setEmailSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and follow the link to verify your email address.",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = () => {
    // Force refresh of the auth token to get the latest email verification status
    const user = getCurrentUser();
    if (user) {
      user.reload().then(() => {
        setEmailVerified(isEmailVerified());
        if (isEmailVerified()) {
          toast({
            title: "Email verified",
            description: "Your email has been successfully verified. Thank you!",
          });
        } else {
          toast({
            title: "Not verified yet",
            description: "Your email is not verified yet. Please check your inbox for the verification link.",
            variant: "destructive",
          });
        }
      }).catch(error => {
        console.error("Error refreshing auth state:", error);
      });
    }
  };

  if (emailVerified) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <AlertTitle className="text-green-700">Email verified</AlertTitle>
        <AlertDescription className="text-green-600">
          Your email address has been verified. You now have full access to all features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertTitle className="text-amber-700">Email verification required</AlertTitle>
      <AlertDescription className="text-amber-600">
        <p className="mb-4">
          Please verify your email address to unlock all features. We've sent a verification link to your email.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={handleSendVerificationEmail}
            disabled={loading || emailSent}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : emailSent ? (
              "Email sent"
            ) : (
              "Resend verification email"
            )}
          </Button>
          <Button 
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={checkVerificationStatus}
          >
            I've verified my email
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}