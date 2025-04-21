import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Trophy, 
  Home, 
  Star, 
  MapPin, 
  Leaf, 
  Sunrise, 
  Tent, 
  Castle, 
  Palmtree, 
  Mountain, 
  Sparkles, 
  ShoppingBag
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// تعريف الإنجازات وشروطها
const achievementDefinitions = {
  // إنجازات الحجز
  firstBooking: {
    id: 'firstBooking',
    title: 'المسافر المبتدئ',
    description: 'قمت بإجراء أول حجز لك',
    icon: <Home className="h-8 w-8 text-blue-500" />,
    points: 50,
    condition: (userData: any) => userData.bookingsCount >= 1,
    progress: (userData: any) => Math.min(userData.bookingsCount, 1)
  },
  frequentBooker: {
    id: 'frequentBooker',
    title: 'مسافر متمرس',
    description: 'قمت بإجراء 5 حجوزات',
    icon: <Trophy className="h-8 w-8 text-amber-500" />,
    points: 150,
    condition: (userData: any) => userData.bookingsCount >= 5,
    progress: (userData: any) => Math.min(userData.bookingsCount / 5, 1) 
  },
  luxuryStay: {
    id: 'luxuryStay',
    title: 'المقيم الفاخر',
    description: 'قمت بحجز إقامة فاخرة',
    icon: <Star className="h-8 w-8 text-yellow-500" />,
    points: 100,
    condition: (userData: any) => userData.hasLuxuryBooking,
    progress: (userData: any) => userData.hasLuxuryBooking ? 1 : 0
  },
  
  // إنجازات المواقع
  beachExplorer: {
    id: 'beachExplorer',
    title: 'مستكشف الشواطئ',
    description: 'قمت بزيارة 3 وجهات شاطئية مختلفة',
    icon: <Palmtree className="h-8 w-8 text-teal-500" />,
    points: 75,
    condition: (userData: any) => userData.uniqueBeachLocations >= 3,
    progress: (userData: any) => Math.min(userData.uniqueBeachLocations / 3, 1)
  },
  northCoastFan: {
    id: 'northCoastFan',
    title: 'عاشق الساحل الشمالي',
    description: 'قمت بزيارة الساحل الشمالي 3 مرات',
    icon: <Sunrise className="h-8 w-8 text-orange-500" />,
    points: 100,
    condition: (userData: any) => userData.northCoastBookings >= 3,
    progress: (userData: any) => Math.min(userData.northCoastBookings / 3, 1)
  },
  
  // إنجازات النقاط
  pointsCollector: {
    id: 'pointsCollector',
    title: 'جامع النقاط',
    description: 'جمعت 500 نقطة من ChillPoints',
    icon: <Sparkles className="h-8 w-8 text-purple-500" />,
    points: 50,
    condition: (userData: any) => userData.rewardPoints >= 500,
    progress: (userData: any) => Math.min(userData.rewardPoints / 500, 1)
  },
  
  // إنجازات المراجعات
  helpfulReviewer: {
    id: 'helpfulReviewer',
    title: 'مراجع مفيد',
    description: 'قمت بكتابة 3 مراجعات للعقارات',
    icon: <Leaf className="h-8 w-8 text-green-500" />,
    points: 75,
    condition: (userData: any) => userData.reviewsCount >= 3,
    progress: (userData: any) => Math.min(userData.reviewsCount / 3, 1)
  },
  
  // إنجازات الخدمات
  serviceExplorer: {
    id: 'serviceExplorer',
    title: 'مستكشف الخدمات',
    description: 'استخدمت 3 خدمات مختلفة من خدماتنا',
    icon: <ShoppingBag className="h-8 w-8 text-indigo-500" />,
    points: 100,
    condition: (userData: any) => userData.uniqueServicesUsed >= 3,
    progress: (userData: any) => Math.min(userData.uniqueServicesUsed / 3, 1)
  }
};

// دالة لمعرفة ما إذا كان الإنجاز متاح
const isAchievementUnlocked = (achievement: any, userData: any) => {
  return achievement.condition(userData);
};

interface AchievementSystemProps {
  variant?: 'full' | 'compact' | 'badge-only';
  showCompleted?: boolean;
}

const AchievementSystem = ({ 
  variant = 'full',
  showCompleted = true
}: AchievementSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBadge, setShowNewBadge] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserAchievementsData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', `/api/users/${user.id}/achievements`);
        const data = await response.json();
        setUserData(data);
        
        // إذا كان لدينا إنجاز جديد غير معروض، نظهره
        if (data.newAchievementId) {
          setShowNewBadge(data.newAchievementId);
          
          // إظهار إشعار للإنجاز الجديد
          const achievement = achievementDefinitions[data.newAchievementId as keyof typeof achievementDefinitions];
          
          toast({
            title: `🎉 مبروك! لقد حصلت على إنجاز جديد`,
            description: `${achievement.title}: ${achievement.description}`,
            duration: 5000,
          });
          
          // أخبر الخادم أننا عرضنا الإنجاز الجديد
          await apiRequest('POST', `/api/users/${user.id}/achievements/${data.newAchievementId}/seen`);
        }
      } catch (error) {
        console.error('Error fetching user achievements data:', error);
        
        // في حالة عدم توفر الواجهة، استخدم بيانات افتراضية بناءً على المستخدم
        if (user) {
          // بناء بيانات أساسية للمستخدم
          setUserData({
            bookingsCount: 0,
            reviewsCount: 0,
            uniqueBeachLocations: 0,
            northCoastBookings: 0,
            hasLuxuryBooking: false,
            uniqueServicesUsed: 0,
            rewardPoints: user.rewardPoints || 0,
            unlockedAchievements: []
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAchievementsData();
  }, [user, toast]);
  
  // حساب الإنجازات المقفلة والمفتوحة
  const achievements = useMemo(() => {
    if (!userData) return { unlocked: [], locked: [] };
    
    const unlocked = [];
    const locked = [];
    
    for (const [key, achievement] of Object.entries(achievementDefinitions)) {
      const achievementData = {
        ...achievement,
        unlocked: isAchievementUnlocked(achievement, userData),
        progress: achievement.progress(userData)
      };
      
      if (achievementData.unlocked) {
        unlocked.push(achievementData);
      } else {
        locked.push(achievementData);
      }
    }
    
    return { unlocked, locked };
  }, [userData]);
  
  // إذا لم يكن لدينا مستخدم أو بيانات بعد
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-2/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-100 h-48 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user || !userData) {
    return null;
  }
  
  // عرض شارات الإنجازات فقط
  if (variant === 'badge-only') {
    return (
      <div className="flex flex-wrap gap-2">
        {achievements.unlocked.map((achievement) => (
          <Badge 
            key={achievement.id}
            variant="outline"
            className="flex items-center gap-1 py-1 px-2 bg-gradient-to-r from-amber-50 to-yellow-100 border-yellow-200"
          >
            <span className="text-xs">{achievement.title}</span>
            {achievement.icon}
          </Badge>
        ))}
      </div>
    );
  }
  
  // عرض نسخة مختصرة من نظام الإنجازات
  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="h-5 w-5 text-amber-500" />
            إنجازاتك
          </CardTitle>
          <CardDescription>
            لقد أكملت {achievements.unlocked.length} من أصل {Object.keys(achievementDefinitions).length} إنجاز
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {achievements.unlocked.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {achievement.icon}
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <Badge variant="secondary" className="flex-shrink-0">
                  +{achievement.points}
                </Badge>
              </div>
            ))}
            
            {achievements.unlocked.length > 3 && (
              <div className="text-center">
                <Button variant="link" size="sm">
                  عرض المزيد من الإنجازات
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // العرض الكامل
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            الإنجازات والجوائز
          </h2>
          <p className="text-muted-foreground mt-1">أكمل الإنجازات واكسب المزيد من نقاط ChillPoints</p>
        </div>
        
        <div className="flex items-center bg-blue-50 rounded-lg p-2 border border-blue-100">
          <Star className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <span className="text-sm text-blue-700">نقاطك الحالية:</span>
            <span className="text-lg font-bold text-blue-700 mr-1">{userData.rewardPoints}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* عرض الإنجازات المقفلة */}
        {showCompleted && achievements.unlocked.map((achievement) => (
          <Card key={achievement.id} className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="bg-emerald-500">مكتمل</Badge>
            </div>
            
            <CardHeader className="pt-10 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/80 border border-emerald-200 shadow-sm">
                  {achievement.icon}
                </div>
                <CardTitle className="text-lg">{achievement.title}</CardTitle>
              </div>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <Progress value={100} className="h-2 bg-emerald-100" />
            </CardContent>
            
            <CardFooter className="pt-0 pb-4">
              <Badge variant="outline" className="ml-auto bg-white border-emerald-200">
                +{achievement.points} نقطة
              </Badge>
            </CardFooter>
          </Card>
        ))}
        
        {/* عرض الإنجازات غير المقفلة */}
        {achievements.locked.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={`overflow-hidden ${showNewBadge === achievement.id ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
          >
            {showNewBadge === achievement.id && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-pulse"></div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100 border border-gray-200">
                  {achievement.icon}
                </div>
                <CardTitle className="text-lg">{achievement.title}</CardTitle>
              </div>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-muted-foreground">
                  {Math.round(achievement.progress * 100)}% مكتمل
                </p>
              </div>
              <Progress value={achievement.progress * 100} className="h-2" />
            </CardContent>
            
            <CardFooter className="pt-0 pb-4">
              <Badge variant="outline" className="ml-auto">
                +{achievement.points} نقطة
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AchievementSystem;