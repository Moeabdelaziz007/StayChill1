import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface RewardTransaction {
  id: number;
  userId: number;
  bookingId?: number;
  points: number;
  description: string;
  transactionType: 'earn' | 'redeem' | 'transfer' | 'expire';
  recipientId?: number;
  expiryDate?: string | Date;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  createdAt: string | Date;
}

export const useRewards = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user reward transactions
  const getUserRewards = () => {
    return useQuery<RewardTransaction[]>({
      queryKey: ["/api/rewards"],
    });
  };
  
  // Get upcoming point expirations
  const getUpcomingExpirations = () => {
    return useQuery<RewardTransaction[]>({
      queryKey: ["/api/rewards/expiring"],
    });
  };
  
  // Get reward statistics
  const getRewardStats = () => {
    return useQuery<{
      totalEarned: number;
      totalRedeemed: number;
      totalAvailable: number;
      expiringPoints: number;
      expiringDate: string | null;
    }>({
      queryKey: ["/api/rewards/stats"],
    });
  };
  
  // Redeem points
  const redeemPointsMutation = useMutation({
    mutationFn: async ({ points, description }: { points: number; description: string }) => {
      const response = await apiRequest("POST", "/api/rewards/redeem", { points, description });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] }); // To update user points in auth context
      toast({
        title: "Points redeemed",
        description: "Your points have been redeemed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption failed",
        description: `Failed to redeem points: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Transfer points to another user
  const transferPointsMutation = useMutation({
    mutationFn: async ({ 
      points, 
      recipientEmail, 
      description 
    }: { 
      points: number; 
      recipientEmail: string; 
      description: string 
    }) => {
      const response = await apiRequest("POST", "/api/rewards/transfer", { 
        points, 
        recipientEmail, 
        description 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Points transferred",
        description: "Your points have been transferred successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer failed",
        description: `Failed to transfer points: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const redeemPoints = async (points: number, description: string) => {
    return redeemPointsMutation.mutateAsync({ points, description });
  };
  
  const transferPoints = async (points: number, recipientEmail: string, description: string) => {
    return transferPointsMutation.mutateAsync({ points, recipientEmail, description });
  };
  
  return {
    getUserRewards,
    getUpcomingExpirations,
    getRewardStats,
    redeemPoints,
    transferPoints,
    isRedeeming: redeemPointsMutation.isPending,
    isTransferring: transferPointsMutation.isPending,
  };
};
