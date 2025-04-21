import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, PieChart, Users, TrendingUp, 
  ShieldAlert, BarChart, LineChart, ChevronUp, 
  ChevronDown, Award, Target, Clock, Brain, AlertCircle, 
  RefreshCw, User
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// واجهة لبيانات تحليل سلوك العملاء
interface CustomerSegment {
  name: string;
  description: string;
  customerIds: number[];
  targetingStrategies: string[];
}

interface CustomerSegmentation {
  segments: CustomerSegment[];
  insights: string[];
}

interface ReviewAnalysisData {
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  commonPraises: string[];
  commonComplaints: string[];
  trendsOverTime: { period: string; averageRating: number; commonThemes: string[] }[];
  actionableInsights: string[];
}

// مكون تحليل سلوك العملاء باستخدام الذكاء الاصطناعي
export const CustomerBehaviorAnalysis: React.FC<{
  propertyId?: number;
  className?: string;
  isAdmin?: boolean;
}> = ({ propertyId, className, isAdmin = true }) => {
  const { t, locale } = useTranslation();
  const [reviewData, setReviewData] = useState<ReviewAnalysisData | null>(null);
  const [segmentationData, setSegmentationData] = useState<CustomerSegmentation | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);
  const [expandedInsights, setExpandedInsights] = useState<Record<number, boolean>>({});
  const [expandedStrategies, setExpandedStrategies] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('segments');
  const [error, setError] = useState<string | null>(null);

  // جلب بيانات التحليل
  const fetchAnalysisData = async () => {
    if (activeTab === 'segments') {
      fetchSegmentationData();
    } else {
      fetchReviewData();
    }
  };

  // جلب بيانات تحليل المراجعات
  const fetchReviewData = async () => {
    setIsLoadingReviews(true);
    setError(null);
    
    try {
      const endpoint = propertyId 
        ? `/api/properties/${propertyId}/review-analysis`
        : '/api/analytics/review-analysis';
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setReviewData(data);
    } catch (err) {
      console.error('Error loading review analysis:', err);
      setError(t('ai.analytics.errorReviews'));
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // جلب بيانات تقسيم العملاء
  const fetchSegmentationData = async () => {
    setIsLoadingSegments(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/analytics/customer-segmentation');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSegmentationData(data);
    } catch (err) {
      console.error('Error loading customer segmentation:', err);
      setError(t('ai.analytics.errorSegments'));
    } finally {
      setIsLoadingSegments(false);
    }
  };

  // تحميل البيانات عند التبديل بين علامات التبويب
  useEffect(() => {
    fetchAnalysisData();
  }, [activeTab, propertyId]);

  // تبديل حالة توسيع الرؤى
  const toggleInsight = (index: number) => {
    setExpandedInsights(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // تبديل حالة توسيع الاستراتيجيات
  const toggleStrategy = (index: number) => {
    setExpandedStrategies(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // عرض واجهة التحميل
  const renderLoading = () => (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );

  // عرض رسالة خطأ
  const renderError = () => (
    <div className="text-center py-8">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">{t('ai.analytics.errorTitle')}</h3>
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={fetchAnalysisData} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        {t('ai.analytics.tryAgain')}
      </Button>
    </div>
  );

  // عرض تحليل المراجعات
  const renderReviewAnalysis = () => {
    if (!reviewData) return null;
    
    const { sentimentBreakdown, commonPraises, commonComplaints, trendsOverTime, actionableInsights } = reviewData;
    const totalSentiment = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* توزيع المشاعر */}
          <Card className="bg-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-primary" />
                {t('ai.analytics.sentimentBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    {t('ai.analytics.positive')}
                  </span>
                  <span>{Math.round((sentimentBreakdown.positive / totalSentiment) * 100)}%</span>
                </div>
                <Progress value={(sentimentBreakdown.positive / totalSentiment) * 100} className="h-1.5 bg-muted" indicatorClassName="bg-green-500" />
                
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    {t('ai.analytics.neutral')}
                  </span>
                  <span>{Math.round((sentimentBreakdown.neutral / totalSentiment) * 100)}%</span>
                </div>
                <Progress value={(sentimentBreakdown.neutral / totalSentiment) * 100} className="h-1.5 bg-muted" indicatorClassName="bg-blue-500" />
                
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    {t('ai.analytics.negative')}
                  </span>
                  <span>{Math.round((sentimentBreakdown.negative / totalSentiment) * 100)}%</span>
                </div>
                <Progress value={(sentimentBreakdown.negative / totalSentiment) * 100} className="h-1.5 bg-muted" indicatorClassName="bg-green-500" />
              </div>
            </CardContent>
          </Card>
          
          {/* الثناء الشائع */}
          <Card className="bg-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                {t('ai.analytics.topPraises')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {commonPraises.slice(0, 4).map((praise, idx) => (
                  <li key={idx} className="text-sm flex gap-1.5">
                    <span className="text-green-500 text-xs mt-0.5">●</span>
                    <span className="text-muted-foreground">{praise}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* الشكاوى الشائعة */}
          <Card className="bg-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-primary" />
                {t('ai.analytics.topComplaints')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {commonComplaints.slice(0, 4).map((complaint, idx) => (
                  <li key={idx} className="text-sm flex gap-1.5">
                    <span className="text-green-500 text-xs mt-0.5">●</span>
                    <span className="text-muted-foreground">{complaint}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* الاتجاهات بمرور الوقت */}
        <Card className="bg-background/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('ai.analytics.trendsOverTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendsOverTime.map((trend, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{trend.period}</span>
                    <Badge variant="outline" className={cn(
                      "px-2 py-0.5 text-xs",
                      trend.averageRating >= 4.5 ? "bg-green-50 text-green-700 border-green-200" :
                      trend.averageRating >= 3.5 ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    )}>
                      {trend.averageRating.toFixed(1)} ★
                    </Badge>
                  </div>
                  <Progress 
                    value={(trend.averageRating / 5) * 100} 
                    className="h-1 bg-muted" 
                    indicatorClassName={cn(
                      trend.averageRating >= 4.5 ? "bg-green-500" :
                      trend.averageRating >= 3.5 ? "bg-blue-500" :
                      "bg-green-500"
                    )} 
                  />
                  <p className="text-xs text-muted-foreground">
                    {trend.commonThemes.slice(0, 3).join(' • ')}
                  </p>
                  {idx < trendsOverTime.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* الرؤى القابلة للتنفيذ */}
        <Card className="bg-background/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-primary" />
              {t('ai.analytics.actionableInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionableInsights.map((insight, idx) => (
                <Card key={idx} className="bg-muted/40 shadow-none border">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className={cn(
                        "text-sm text-muted-foreground overflow-hidden",
                        !expandedInsights[idx] && "line-clamp-2"
                      )}>
                        {insight}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full" 
                        onClick={() => toggleInsight(idx)}
                      >
                        {expandedInsights[idx] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // عرض تقسيم العملاء
  const renderCustomerSegmentation = () => {
    if (!segmentationData) return null;
    
    const { segments, insights } = segmentationData;
    
    return (
      <div className="space-y-6">
        {/* الرؤى العامة */}
        <Card className="bg-background/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-primary" />
              {t('ai.analytics.keyInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="text-sm flex gap-1.5">
                  <span className="text-primary text-xs mt-0.5">●</span>
                  <span className="text-muted-foreground">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* تقسيمات العملاء */}
        <div className="space-y-4">
          <h3 className="text-base font-medium flex items-center gap-1.5">
            <Users className="h-5 w-5 text-primary" />
            {t('ai.analytics.customerSegments')}
          </h3>
          
          <div className="space-y-4">
            {segments.map((segment, idx) => (
              <Card key={idx} className="bg-background/60">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-md font-medium">
                      {segment.name}
                    </CardTitle>
                    <Badge className={cn(
                      "px-1.5 py-0.5",
                      idx === 0 ? "bg-green-50 text-green-700 border-green-200" :
                      idx === 1 ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    )}>
                      {segment.customerIds.length} {t('ai.analytics.users')}
                    </Badge>
                  </div>
                  <CardDescription>
                    {segment.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <h4 className="font-medium flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-primary" />
                        {t('ai.analytics.targetingStrategies')}
                      </h4>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 p-0.5 px-2 text-xs gap-1" 
                        onClick={() => toggleStrategy(idx)}
                      >
                        {expandedStrategies[idx] ? (
                          <>
                            {t('ai.analytics.showLess')}
                            <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            {t('ai.analytics.showAll')}
                            <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <ul className="space-y-2">
                      {segment.targetingStrategies
                        .slice(0, expandedStrategies[idx] ? undefined : 3)
                        .map((strategy, strategyIdx) => (
                          <li key={strategyIdx} className="text-sm flex gap-1.5">
                            <span className="text-primary text-xs mt-0.5 min-w-[8px]">●</span>
                            <span className="text-muted-foreground">{strategy}</span>
                          </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                
                {isAdmin && (
                  <CardFooter className="pt-0 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <User className="h-3 w-3" />
                      {t('ai.analytics.viewCustomers')}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {t('ai.analytics.scheduleEmail')}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t('ai.analytics.title')}
        </CardTitle>
        <CardDescription>
          {t('ai.analytics.subtitle')}
        </CardDescription>
        
        <Tabs defaultValue="segments" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="segments" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {t('ai.analytics.tabs.segments')}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1.5">
              <LineChart className="h-4 w-4" />
              {t('ai.analytics.tabs.reviews')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {error ? renderError() : (
          <>
            <TabsContent value="segments">
              {isLoadingSegments ? renderLoading() : renderCustomerSegmentation()}
            </TabsContent>
            
            <TabsContent value="reviews">
              {isLoadingReviews ? renderLoading() : renderReviewAnalysis()}
            </TabsContent>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Badge variant="outline" className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 gap-1.5">
          <Brain className="h-3.5 w-3.5" />
          {t('ai.analytics.aiGenerated')}
        </Badge>
        
        <Button onClick={fetchAnalysisData} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          {t('ai.analytics.refreshData')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomerBehaviorAnalysis;