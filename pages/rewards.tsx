import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RewardsCard } from '@/components/rewards/RewardsCard';
import { RewardHistoryTable } from '@/components/rewards/RewardHistoryTable';
import { ChillPointsProvider } from '@/components/rewards/ChillPointsProvider';
import { useTranslation } from '@/lib/i18n';
import { ProtectedRoute } from '@/lib/protected-route';
import { Webhook, Gift } from 'lucide-react';

const RewardsPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState<string>('overview');

  return (
    <ChillPointsProvider>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">{t('rewards.rewardsPageTitle')}</h1>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              {t('rewards.overviewTab')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              {t('rewards.historyTab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="max-w-md mx-auto">
              <RewardsCard />
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">{t('rewards.howToEarnTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{t('rewards.earnMethods.bookings.title')}</h3>
                  <p className="text-muted-foreground">{t('rewards.earnMethods.bookings.description')}</p>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{t('rewards.earnMethods.referrals.title')}</h3>
                  <p className="text-muted-foreground">{t('rewards.earnMethods.referrals.description')}</p>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{t('rewards.earnMethods.activities.title')}</h3>
                  <p className="text-muted-foreground">{t('rewards.earnMethods.activities.description')}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="max-w-4xl mx-auto">
              <RewardHistoryTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ChillPointsProvider>
  );
};

export default ProtectedRoute(RewardsPage);