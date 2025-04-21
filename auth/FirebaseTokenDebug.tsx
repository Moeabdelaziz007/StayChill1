import { useState } from 'react';
import { getFirebaseIdToken, getCurrentUser } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

/**
 * This component demonstrates how to get a Firebase ID token
 * and use it for API requests
 */
export function FirebaseTokenDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenData, setTokenData] = useState<{ token: string | null, userData: any | null }>({
    token: null,
    userData: null
  });

  // Get Firebase token and make API request with it
  const handleGetTokenAndFetchMe = async () => {
    setIsLoading(true);
    try {
      // Check if user is logged in with Firebase
      const firebaseUser = getCurrentUser();
      if (!firebaseUser) {
        toast({
          title: "Not logged in",
          description: "You need to log in with Firebase first",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Get Firebase ID token
      const token = await getFirebaseIdToken();
      console.log("Firebase ID token:", token ? token.substring(0, 20) + "..." : null);

      if (!token) {
        toast({
          title: "Error",
          description: "Failed to get Firebase token",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Make API request to /api/me with the token
      const res = await fetch("/api/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      // Check response
      if (res.ok) {
        const data = await res.json();
        console.log("User data from API:", data);
        setTokenData({ token, userData: data });
        toast({
          title: "Success",
          description: "Successfully fetched user data with Firebase token",
        });
      } else {
        const errorData = await res.json();
        console.error("API Error:", errorData);
        setTokenData({ token, userData: null });
        toast({
          title: "API Error",
          description: errorData.message || "Failed to fetch user data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-4">Firebase Token Debug</h3>
      
      <Button 
        onClick={handleGetTokenAndFetchMe} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? "Loading..." : "Get Token & Fetch User"}
      </Button>
      
      {tokenData.token && (
        <div className="mt-4">
          <h4 className="font-medium">Token (first 20 chars):</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">
            {tokenData.token.substring(0, 20)}...
          </pre>
        </div>
      )}
      
      {tokenData.userData && (
        <div className="mt-4">
          <h4 className="font-medium">User Data:</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">
            {JSON.stringify(tokenData.userData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}