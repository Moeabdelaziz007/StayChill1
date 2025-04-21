import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useChillPoints } from './ChillPointsProvider';
import { Sparkles, Award, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

export const RewardsCard: React.FC = () => {
  const { rewards, pointsLoading, expiringPoints, expiringLoading } = useChillPoints();
  const { t, locale } = useTranslation();
  
  // رسالة الحالة بناءً على مستوى العضوية
  const getTierMessage = () => {
    if (!rewards?.tier) return '';
    
    switch(rewards.tier.name) {
      case 'silver':
        return t('rewards.tierMessages.silver');
      case 'gold':
        return t('rewards.tierMessages.gold');
      case 'platinum':
        return t('rewards.tierMessages.platinum');
      default:
        return '';
    }
  };

  // استخراج تاريخ انتهاء صلاحية أقرب نقاط
  const getNearestExpiryDate = () => {
    if (!expiringPoints?.nearestExpiry) return null;
    
    try {
      const date = new Date(expiringPoints.nearestExpiry);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: locale === 'ar' ? arSA : undefined
      });
    } catch (error) {
      console.error('Error formatting expiry date:', error);
      return null;
    }
  };

  // تحديد لون مستوى العضوية
  const getTierColor = () => {
    if (!rewards?.tier) return 'bg-gray-200';
    
    switch(rewards.tier.name) {
      case 'silver':
        return 'bg-gray-300';
      case 'gold':
        return 'bg-amber-300';
      case 'platinum':
        return 'bg-violet-400';
      default:
        return 'bg-gray-200';
    }
  };
  
  // واجهة التحميل
  if (pointsLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-2">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // في حالة عدم وجود بيانات المكافآت
  if (!rewards) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('rewards.noRewardsTitle')}</CardTitle>
          <CardDescription>{t('rewards.noRewardsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t('rewards.startEarning')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <div className={`h-2 ${getTierColor()}`} />
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {t('rewards.chillPoints')}
          </CardTitle>
          <Badge variant="outline" className={`${getTierColor()} border-0 text-black font-medium`}>
            {rewards.tier.name.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{getTierMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col gap-6">
          {/* عرض مجموع النقاط */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">{t('rewards.availablePoints')}</h3>
            <span className="text-3xl font-bold">{rewards.points.toLocaleString()}</span>
          </div>
          
          {/* شريط التقدم نحو المستوى التالي */}
          {rewards.nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('rewards.currentTier')}: {rewards.tier.name.toUpperCase()}
                </span>
                <span className="text-muted-foreground">
                  {t('rewards.nextTier')}: {rewards.nextTier.name.toUpperCase()}
                </span>
              </div>
              <Progress value={rewards.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(rewards.progress)}% {t('rewards.toNextTier')}
              </p>
            </div>
          )}
          
          {/* معلومات حول النقاط المقبلة للانتهاء */}
          {!expiringLoading && expiringPoints && expiringPoints.totalExpiring > 0 && (
            <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md">
              <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('rewards.expiringPoints', { count: expiringPoints.totalExpiring })}</p>
                {getNearestExpiryDate() && (
                  <p className="text-xs text-muted-foreground">{t('rewards.firstExpiryDate')} {getNearestExpiryDate()}</p>
                )}
              </div>
            </div>
          )}
          
          {/* مزايا المستوى الحالي */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">{t('rewards.tierBenefits')}</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 rtl:pr-5 ltr:pl-5">
              {rewards.tier.benefits.map((benefit, index) => (
                <li key={index} className="list-disc rtl:mr-2 ltr:ml-2">{benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
          <div>
            <p className="font-medium">{rewards.statistics.totalEarned}</p>
            <p>{t('rewards.totalEarned')}</p>
          </div>
          <div>
            <p className="font-medium">{rewards.statistics.totalRedeemed}</p>
            <p>{t('rewards.totalRedeemed')}</p>
          </div>
          <div>
            <p className="font-medium">{rewards.statistics.transactionsCount}</p>
            <p>{t('rewards.transactions')}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};