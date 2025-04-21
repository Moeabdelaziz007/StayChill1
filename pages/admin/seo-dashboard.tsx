import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowUpRight, Search, ArrowDown, ArrowUp, ExternalLink, BarChart4, LineChart, PieChart } from 'lucide-react';
import AccessGuard from '@/components/auth/access-guard';
import { ACCESS_TIERS } from '@/lib/access-control';
import NetworkErrorContainer from '@/components/ui/network-error-container';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

// Utility for formatting numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// KeywordPerformance component
const KeywordPerformance: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  const { data: keywordData, isLoading } = useQuery({
    queryKey: ['/api/admin/seo/keywords', timeRange],
    enabled: true,
  });

  const filteredKeywords = keywordData?.keywords?.filter(
    (keyword: any) => keyword.term.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>أداء الكلمات المفتاحية</CardTitle>
        <CardDescription>
          تحليل أداء الكلمات المفتاحية في محركات البحث
        </CardDescription>
        <div className="flex items-center space-x-2 space-x-reverse mt-4">
          <div className="relative w-full">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن كلمة مفتاحية..."
              className="w-full pr-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 أيام</SelectItem>
              <SelectItem value="30d">30 يوم</SelectItem>
              <SelectItem value="90d">90 يوم</SelectItem>
              <SelectItem value="1y">سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {filteredKeywords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد كلمات مفتاحية مطابقة للبحث
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 font-medium text-sm px-2 pb-1 border-b">
                  <div>الكلمة المفتاحية</div>
                  <div className="text-center">الترتيب</div>
                  <div className="text-center">الظهور</div>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {filteredKeywords.map((keyword: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="grid grid-cols-3 gap-4 items-center"
                    >
                      <div className="text-sm font-medium">{keyword.term}</div>
                      
                      <div className="text-center flex flex-col items-center text-sm">
                        <div className="flex items-center">
                          <span className="font-medium">{keyword.position}</span>
                          {keyword.change !== 0 && (
                            <span className={`ml-1 flex items-center ${keyword.change < 0 ? 'text-green-500' : 'text-destructive'}`}>
                              {keyword.change < 0 ? (
                                <ArrowUp className="h-3 w-3 mr-0.5" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-0.5" />
                              )}
                              {Math.abs(keyword.change)}
                            </span>
                          )}
                        </div>
                        <Progress
                          value={Math.max(0, 100 - keyword.position * 2)}
                          className="h-1.5 w-24 mt-1"
                        />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {formatNumber(keyword.impressions)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          CTR: {keyword.ctr}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            toast({
              title: "تم تصدير البيانات",
              description: "تم تصدير بيانات الكلمات المفتاحية بنجاح"
            });
          }}
        >
          تصدير البيانات
        </Button>
      </CardFooter>
    </Card>
  );
};

// PagePerformance component
const PagePerformance: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [sortBy, setSortBy] = useState('impressions');

  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['/api/admin/seo/pages', timeRange],
    enabled: true,
  });

  const sortedPages = React.useMemo(() => {
    if (!pagesData?.pages) return [];
    
    return [...pagesData.pages].sort((a, b) => {
      switch (sortBy) {
        case 'impressions':
          return b.impressions - a.impressions;
        case 'clicks':
          return b.clicks - a.clicks;
        case 'position':
          return a.avgPosition - b.avgPosition;
        case 'ctr':
          return b.ctr - a.ctr;
        default:
          return 0;
      }
    });
  }, [pagesData, sortBy]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>أداء الصفحات</CardTitle>
        <CardDescription>
          تحليل أداء صفحات الموقع في محركات البحث
        </CardDescription>
        <div className="flex items-center space-x-2 space-x-reverse mt-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impressions">الظهور</SelectItem>
              <SelectItem value="clicks">النقرات</SelectItem>
              <SelectItem value="position">الترتيب</SelectItem>
              <SelectItem value="ctr">معدل النقر (CTR)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 أيام</SelectItem>
              <SelectItem value="30d">30 يوم</SelectItem>
              <SelectItem value="90d">90 يوم</SelectItem>
              <SelectItem value="1y">سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-2 font-medium text-sm px-2 pb-1 border-b">
              <div className="col-span-2">المسار</div>
              <div className="text-center">الظهور</div>
              <div className="text-center">النقرات</div>
              <div className="text-center">المتوسط</div>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {sortedPages.map((page: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-5 gap-2 items-center"
                >
                  <div className="col-span-2 text-sm font-medium truncate" title={page.path}>
                    <div className="flex items-center">
                      <span className="truncate max-w-[200px]">{page.path}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 mr-1" asChild>
                        <a href={`https://staychill.com${page.path}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {page.title}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {formatNumber(page.impressions)}
                    </div>
                    {page.impressionChange !== 0 && (
                      <div className={`text-xs ${page.impressionChange > 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {page.impressionChange > 0 ? '+' : ''}{page.impressionChange}%
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {formatNumber(page.clicks)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      CTR: {page.ctr}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {page.avgPosition.toFixed(1)}
                    </div>
                    {page.positionChange !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${page.positionChange < 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {page.positionChange < 0 ? (
                          <ArrowUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(page.positionChange)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Overview component
const Overview: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['/api/admin/seo/overview', timeRange],
    enabled: true,
  });

  const metrics = overviewData?.metrics || {
    impressions: { value: 0, change: 0 },
    clicks: { value: 0, change: 0 },
    avgPosition: { value: 0, change: 0 },
    ctr: { value: 0, change: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">نظرة عامة على أداء SEO</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 أيام</SelectItem>
            <SelectItem value="30d">30 يوم</SelectItem>
            <SelectItem value="90d">90 يوم</SelectItem>
            <SelectItem value="1y">سنة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="الظهور"
            value={formatNumber(metrics.impressions.value)}
            change={metrics.impressions.change}
            icon={<BarChart4 className="h-5 w-5" />}
          />
          <MetricCard
            title="النقرات"
            value={formatNumber(metrics.clicks.value)}
            change={metrics.clicks.change}
            icon={<ArrowUpRight className="h-5 w-5" />}
          />
          <MetricCard
            title="متوسط الترتيب"
            value={metrics.avgPosition.value.toFixed(1)}
            change={-metrics.avgPosition.change} // Invert change as lower is better
            icon={<LineChart className="h-5 w-5" />}
            inverseChange={true}
          />
          <MetricCard
            title="معدل النقر (CTR)"
            value={metrics.ctr.value.toFixed(2) + '%'}
            change={metrics.ctr.change}
            icon={<PieChart className="h-5 w-5" />}
          />
        </div>
      )}

      {!isLoading && overviewData?.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات الظهور والنقرات</CardTitle>
              <CardDescription>
                مقارنة بين الظهور والنقرات خلال الفترة المحددة
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                [رسم بياني للاتجاهات]
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>توزيع الكلمات المفتاحية حسب الترتيب</CardTitle>
              <CardDescription>
                توزيع الكلمات المفتاحية حسب موقعها في نتائج البحث
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                [رسم بياني للتوزيع]
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// MetricCard component
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  inverseChange?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  inverseChange = false
}) => {
  const isPositive = inverseChange ? change < 0 : change > 0;
  const changeText = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            <div className={`mt-1 text-sm flex items-center ${
              change === 0 
                ? 'text-muted-foreground' 
                : isPositive 
                  ? 'text-green-500' 
                  : 'text-destructive'
            }`}>
              {change !== 0 && (
                <>
                  {isPositive ? (
                    <ArrowUp className="h-4 w-4 mr-0.5" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-0.5" />
                  )}
                  {changeText}
                </>
              )}
              {change === 0 && 'لا تغيير'}
            </div>
          </div>
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TechnicalSEO component
const TechnicalSEO: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { data: technicalData } = useQuery({
    queryKey: ['/api/admin/seo/technical'],
    enabled: true,
  });
  
  const issueData = technicalData?.issues || {
    critical: [],
    important: [],
    moderate: [],
    minor: []
  };
  
  const criticalCount = issueData.critical.length;
  const importantCount = issueData.important.length;
  const moderateCount = issueData.moderate.length;
  const minorCount = issueData.minor.length;
  
  const totalIssues = criticalCount + importantCount + moderateCount + minorCount;
  
  const handleAnalyze = () => {
    if (!url) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "اكتمل التحليل",
        description: `تم تحليل الصفحة ${url} بنجاح.`
      });
    }, 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>التحليل التقني لـ SEO</CardTitle>
        <CardDescription>
          فحص الصفحات بحثًا عن مشاكل تقنية تؤثر على محركات البحث
        </CardDescription>
        <div className="flex space-x-2 space-x-reverse mt-4">
          <div className="flex-1">
            <Input
              placeholder="أدخل عنوان URL للتحليل... (مثال: /property/1)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={!url || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جارٍ التحليل...
              </>
            ) : (
              'تحليل'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalCount}</div>
              <div className="text-sm text-red-600 dark:text-red-400">مشاكل حرجة</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{importantCount}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">مشاكل مهمة</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{moderateCount}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">مشاكل متوسطة</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{minorCount}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">مشاكل طفيفة</div>
            </div>
          </div>
          
          {totalIssues > 0 ? (
            <div className="space-y-4">
              {criticalCount > 0 && (
                <IssueSection 
                  title="مشاكل حرجة" 
                  issues={issueData.critical} 
                  severity="critical" 
                />
              )}
              
              {importantCount > 0 && (
                <IssueSection 
                  title="مشاكل مهمة" 
                  issues={issueData.important} 
                  severity="important" 
                />
              )}
              
              {moderateCount > 0 && (
                <IssueSection 
                  title="مشاكل متوسطة" 
                  issues={issueData.moderate} 
                  severity="moderate" 
                />
              )}
              
              {minorCount > 0 && (
                <IssueSection 
                  title="مشاكل طفيفة" 
                  issues={issueData.minor} 
                  severity="minor" 
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مشاكل تقنية. موقعك في حالة جيدة!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// IssueSection component
interface IssueSectionProps {
  title: string;
  issues: any[];
  severity: 'critical' | 'important' | 'moderate' | 'minor';
}

const IssueSection: React.FC<IssueSectionProps> = ({ title, issues, severity }) => {
  const [expanded, setExpanded] = useState(severity === 'critical');
  
  const severityColors = {
    critical: 'text-red-600 dark:text-red-400',
    important: 'text-orange-600 dark:text-orange-400',
    moderate: 'text-yellow-600 dark:text-yellow-400',
    minor: 'text-blue-600 dark:text-blue-400'
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className={`font-medium ${severityColors[severity]}`}>{title}</h3>
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}>
          {expanded ? 'إخفاء' : 'عرض'}
        </Button>
      </div>
      
      {expanded && (
        <div className="p-4 space-y-4">
          {issues.map((issue, index) => (
            <div key={index} className="text-sm">
              <div className="font-medium">{issue.title}</div>
              <div className="text-muted-foreground mt-1">{issue.description}</div>
              {issue.affectedPages && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">الصفحات المتأثرة:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {issue.affectedPages.map((page: string, i: number) => (
                      <div key={i} className="flex items-center">
                        <span className="truncate max-w-[300px]">{page}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 mr-1" asChild>
                          <a href={`https://staychill.com${page}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {issue.howToFix && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">كيفية الإصلاح:</div>
                  <div className="text-xs text-muted-foreground">{issue.howToFix}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main SEO Dashboard component
const SEODashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <AccessGuard
      requiredTier={ACCESS_TIERS.SUPER_ADMIN}
      redirectTo="/auth/login"
    >
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">لوحة أداء SEO</h1>
          <p className="text-muted-foreground mt-1">
            تحليل أداء محركات البحث لمنصة StayChill
          </p>
        </div>
        
        <NetworkErrorContainer>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="keywords">الكلمات المفتاحية</TabsTrigger>
              <TabsTrigger value="pages">الصفحات</TabsTrigger>
              <TabsTrigger value="technical">تحليل تقني</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Overview />
            </TabsContent>
            
            <TabsContent value="keywords" className="space-y-6">
              <KeywordPerformance />
            </TabsContent>
            
            <TabsContent value="pages" className="space-y-6">
              <PagePerformance />
            </TabsContent>
            
            <TabsContent value="technical" className="space-y-6">
              <TechnicalSEO />
            </TabsContent>
          </Tabs>
        </NetworkErrorContainer>
      </div>
    </AccessGuard>
  );
};

export default SEODashboard;