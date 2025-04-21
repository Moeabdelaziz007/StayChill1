import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// نوع بيانات مستوى العضوية
interface Tier {
  name: 'silver' | 'gold' | 'platinum';
  threshold: number;
  benefits: string[];
}

// نوع بيانات المعاملة
interface RewardTransaction {
  id: number;
  userId: number;
  points: number;
  description: string;
  transactionType: 'earn' | 'redeem' | 'transfer';
  bookingId?: number | null;
  recipientId?: number | null;
  expiryDate?: Date | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  createdAt: Date;
}

// نوع بيانات إحصائيات المكافآت
interface RewardStatistics {
  totalEarned: number;
  totalRedeemed: number;
  transactionsCount: number;
}

// نوع بيانات حالة نقاط المكافآت
interface RewardsPointsState {
  points: number;
  tier: Tier;
  nextTier: Tier | null;
  progress: number;
  statistics: RewardStatistics;
}

// نوع بيانات النقاط التي توشك على الانتهاء
interface ExpiringPoints {
  expiringTransactions: RewardTransaction[];
  totalExpiring: number;
  nearestExpiry: Date | null;
}

// نوع سياق نقاط المكافآت
interface ChillPointsContextType {
  rewards: RewardsPointsState | null;
  transactions: RewardTransaction[];
  expiringPoints: ExpiringPoints | null;
  pointsLoading: boolean;
  transactionsLoading: boolean;
  expiringLoading: boolean;
  error: Error | null;
  redeemMutation: any;
  transferMutation: any;
  refreshPoints: () => void;
  refreshTransactions: () => void;
}

// إنشاء سياق نقاط المكافآت
const ChillPointsContext = createContext<ChillPointsContextType | null>(null);

export const ChillPointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // استعلامات للحصول على بيانات نقاط المكافآت
  const {
    data: rewards,
    isLoading: pointsLoading,
    error,
    refetch: refreshPoints
  } = useQuery({
    queryKey: ['/api/rewards/points'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest('GET', '/api/rewards/points');
      return await res.json();
    },
    enabled: !!user,
  });
  
  // استعلامات للحصول على معاملات نقاط المكافآت
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    refetch: refreshTransactions
  } = useQuery({
    queryKey: ['/api/rewards/transactions'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/rewards/transactions');
      return await res.json();
    },
    enabled: !!user,
  });
  
  // استعلامات للحصول على النقاط التي توشك على الانتهاء
  const {
    data: expiringPoints,
    isLoading: expiringLoading,
  } = useQuery({
    queryKey: ['/api/rewards/expiring'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest('GET', '/api/rewards/expiring');
      return await res.json();
    },
    enabled: !!user,
  });
  
  // طلب صرف النقاط
  const redeemMutation = useMutation({
    mutationFn: async ({ points, description }: { points: number; description: string }) => {
      const res = await apiRequest('POST', '/api/rewards/redeem', { points, description });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/transactions'] });
      toast({
        title: 'نقاط صرفت بنجاح',
        description: 'تم صرف النقاط بنجاح وتحديث رصيدك.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل في صرف النقاط',
        description: error.message || 'حدث خطأ أثناء صرف النقاط.',
        variant: 'destructive',
      });
    },
  });
  
  // طلب تحويل النقاط
  const transferMutation = useMutation({
    mutationFn: async ({
      points,
      recipientEmail,
      description,
    }: {
      points: number;
      recipientEmail: string;
      description: string;
    }) => {
      const res = await apiRequest('POST', '/api/rewards/transfer', {
        points,
        recipientEmail,
        description,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/transactions'] });
      toast({
        title: 'تم تحويل النقاط بنجاح',
        description: 'تم تحويل النقاط بنجاح للمستلم.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل في تحويل النقاط',
        description: error.message || 'حدث خطأ أثناء تحويل النقاط.',
        variant: 'destructive',
      });
    },
  });
  
  return (
    <ChillPointsContext.Provider
      value={{
        rewards,
        transactions,
        expiringPoints,
        pointsLoading,
        transactionsLoading,
        expiringLoading,
        error,
        redeemMutation,
        transferMutation,
        refreshPoints,
        refreshTransactions,
      }}
    >
      {children}
    </ChillPointsContext.Provider>
  );
};

// هوك للوصول إلى سياق نقاط المكافآت
export const useChillPoints = () => {
  const context = useContext(ChillPointsContext);
  if (!context) {
    throw new Error('useChillPoints must be used within a ChillPointsProvider');
  }
  return context;
};