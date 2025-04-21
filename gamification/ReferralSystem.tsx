import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Share, 
  Copy, 
  Share2, 
  UserPlus, 
  Gift, 
  Award,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Check
} from 'lucide-react';

interface ReferralUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  joinDate: string;
  bookingsCount: number;
  status: 'pending' | 'active' | 'completed';
}

interface ReferralData {
  code: string;
  totalReferrals: number;
  pendingReferrals: number;
  successfulReferrals: number;
  totalPointsEarned: number;
  referralsHistory: ReferralUser[];
}

interface ReferralSystemProps {
  variant?: 'full' | 'compact' | 'widget';
}

const ReferralSystem = ({
  variant = 'full'
}: ReferralSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('share');
  const [copied, setCopied] = useState(false);
  
  // جلب بيانات الإحالة
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', `/api/users/${user.id}/referrals`);
        
        if (response.ok) {
          const data = await response.json();
          setReferralData(data);
        } else {
          // إذا لم تكن واجهة برمجة التطبيقات متاحة، استخدم بيانات عرض توضيحية
          // لاحظ: هذه البيانات للعرض فقط وسيتم استبدالها ببيانات حقيقية
          const demoData: ReferralData = {
            code: `CHILL${user.username.toUpperCase()}25`,
            totalReferrals: 3,
            pendingReferrals: 1,
            successfulReferrals: 2,
            totalPointsEarned: 200,
            referralsHistory: [
              {
                id: 101,
                username: 'frienduser1',
                firstName: 'محمد',
                lastName: 'أحمد',
                joinDate: '2025-03-15',
                bookingsCount: 2,
                status: 'completed'
              },
              {
                id: 102,
                username: 'frienduser2',
                firstName: 'سارة',
                lastName: 'علي',
                joinDate: '2025-03-20',
                bookingsCount: 1,
                status: 'completed'
              },
              {
                id: 103,
                username: 'frienduser3',
                firstName: 'أحمد',
                lastName: 'خالد',
                joinDate: '2025-04-01',
                bookingsCount: 0,
                status: 'pending'
              }
            ]
          };
          
          setReferralData(demoData);
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReferralData();
  }, [user]);
  
  // نسخ رمز الإحالة
  const copyReferralCode = async () => {
    if (!referralData?.code) return;
    
    try {
      await navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      
      toast({
        title: "تم نسخ الرمز",
        description: "تم نسخ رمز الإحالة الخاص بك، شاركه مع أصدقائك!",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      
      toast({
        title: "فشل النسخ",
        description: "لم نتمكن من نسخ الرمز. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };
  
  // مشاركة الرمز
  const shareReferralCode = async (platform: string) => {
    if (!referralData?.code || !user) return;
    
    const referralUrl = `https://staychill.com/signup?ref=${referralData.code}`;
    const shareMessage = `استخدم رمز الإحالة الخاص بي ${referralData.code} للحصول على خصم 10% على حجزك الأول مع StayChill! ابحث عن أفضل الوجهات الشاطئية في مصر.`;
    
    try {
      let shareUrl = '';
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralUrl)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(shareMessage)}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + referralUrl)}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=خصم على حجزك الأول مع StayChill&body=${encodeURIComponent(shareMessage + '\n\n' + referralUrl)}`;
          break;
        default:
          // مشاركة عبر navigator.share إذا كان مدعومًا
          if (navigator.share) {
            await navigator.share({
              title: 'StayChill - احصل على خصم!',
              text: shareMessage,
              url: referralUrl
            });
            return;
          }
      }
      
      // فتح نافذة المشاركة
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=600');
      }
      
      toast({
        title: "تمت المشاركة",
        description: `تمت مشاركة رمز الإحالة الخاص بك عبر ${platform}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      
      toast({
        title: "فشلت المشاركة",
        description: "لم نتمكن من مشاركة الرمز. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };
  
  // أثناء التحميل
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-7 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // عرض مختصر
  if (variant === 'widget') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            ادعُ أصدقاءك واحصل على مكافآت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            عند انضمام صديق باستخدام رمز الإحالة الخاص بك، تحصل على 100 نقطة ChillPoints. يحصل صديقك أيضًا على خصم 10% على حجزه الأول!
          </p>
          
          <div className="flex gap-2">
            <Input 
              value={referralData?.code || ''} 
              readOnly 
              className="font-mono text-center"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={copyReferralCode}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <Button variant="default" className="w-full" onClick={() => setActiveTab('share')}>
            <Share2 className="mr-2 h-4 w-4" />
            شارك الرمز
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // عرض مختصر
  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            برنامج الإحالة
          </CardTitle>
          <CardDescription>
            دعوة الأصدقاء للانضمام إلى StayChill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-xl font-bold text-green-700">{referralData?.successfulReferrals || 0}</span>
              <span className="text-xs text-muted-foreground">إحالات ناجحة</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-xl font-bold text-blue-700">{referralData?.totalPointsEarned || 0}</span>
              <span className="text-xs text-muted-foreground">نقاط مكتسبة</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={referralData?.code || ''} 
              readOnly 
              className="font-mono text-center bg-gray-50"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={copyReferralCode}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="default" size="sm" className="w-full" onClick={() => shareReferralCode('default')}>
            <Share2 className="mr-2 h-4 w-4" />
            مشاركة الرمز
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // العرض الكامل
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Users className="h-6 w-6 text-green-500" />
          برنامج الإحالة
        </CardTitle>
        <CardDescription className="text-base">
          ادعُ أصدقاءك للانضمام إلى StayChill واحصل على مكافآت
        </CardDescription>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-3 bg-gradient-to-l from-green-50 to-blue-50">
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm">
          <UserPlus className="h-8 w-8 text-green-500 mb-2" />
          <span className="text-2xl font-bold text-green-700">{referralData?.totalReferrals || 0}</span>
          <span className="text-sm text-muted-foreground">إجمالي الإحالات</span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm">
          <Award className="h-8 w-8 text-amber-500 mb-2" />
          <span className="text-2xl font-bold text-amber-700">{referralData?.successfulReferrals || 0}</span>
          <span className="text-sm text-muted-foreground">إحالات ناجحة</span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm">
          <Gift className="h-8 w-8 text-blue-500 mb-2" />
          <span className="text-2xl font-bold text-blue-700">{referralData?.totalPointsEarned || 0}</span>
          <span className="text-sm text-muted-foreground">نقاط مكتسبة</span>
        </div>
      </div>
      
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="share" className="flex-1">
              <Share className="h-4 w-4 mr-2" />
              مشاركة الرمز
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              سجل الإحالات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="share" className="pt-4 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">رمز الإحالة الخاص بك</h3>
              <div className="flex gap-2">
                <Input 
                  value={referralData?.code || ''} 
                  readOnly 
                  className="font-mono text-lg text-center bg-gray-50"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyReferralCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                يحصل أصدقاؤك على خصم 10% على حجزهم الأول عند استخدام هذا الرمز
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">مشاركة عبر وسائل التواصل الاجتماعي</h3>
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => shareReferralCode('twitter')}
                >
                  <Twitter className="h-5 w-5 text-blue-400" />
                  <span className="text-xs">Twitter</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => shareReferralCode('facebook')}
                >
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Facebook</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => shareReferralCode('whatsapp')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M12 21a9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9Z" />
                    <path d="M12 9v3" />
                    <path d="M12 15h.01" />
                  </svg>
                  <span className="text-xs">WhatsApp</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => shareReferralCode('email')}
                >
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span className="text-xs">البريد</span>
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Gift className="h-5 w-5" />
                كيف تكسب المكافآت
              </h3>
              <ul className="text-sm space-y-2 text-blue-700 list-disc list-inside">
                <li>تحصل على 100 نقطة ChillPoints لكل صديق يستخدم رمز الإحالة الخاص بك ويسجل في التطبيق</li>
                <li>تحصل على 100 نقطة إضافية عندما يجري صديقك أول حجز</li>
                <li>يحصل صديقك على خصم 10% على الحجز الأول</li>
                <li>يمكنك استبدال النقاط بخصومات على حجوزاتك المستقبلية</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="pt-4">
            {referralData?.referralsHistory && referralData.referralsHistory.length > 0 ? (
              <div className="space-y-4">
                {referralData.referralsHistory.map(referral => (
                  <div 
                    key={referral.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {referral.firstName[0]}{referral.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{referral.firstName} {referral.lastName}</p>
                        <p className="text-xs text-muted-foreground">انضم في {new Date(referral.joinDate).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {referral.status === 'completed' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          مكتمل
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-50">
                          قيد الانتظار
                        </Badge>
                      )}
                      {referral.status === 'completed' && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                          +100 نقطة
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium">لم تقم بإحالة أي أصدقاء بعد</h3>
                <p className="text-sm text-muted-foreground">قم بمشاركة رمز الإحالة الخاص بك مع أصدقائك للحصول على نقاط إضافية</p>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={() => setActiveTab('share')}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  مشاركة الرمز
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReferralSystem;