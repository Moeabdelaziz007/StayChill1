import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Medal, Trophy, Star, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  rewardPoints: number;
  rank: number;
  avatarUrl?: string;
  badgeCount: number;
  level: number;
  isCurrentUser: boolean;
}

interface LeaderboardSystemProps {
  limit?: number;
  showTabs?: boolean;
  showCurrentUserHighlight?: boolean;
}

const LeaderboardSystem = ({
  limit = 10,
  showTabs = true,
  showCurrentUserHighlight = true
}: LeaderboardSystemProps) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-time');
  
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        
        // محاولة طلب البيانات من الخادم
        try {
          const [allTimeResponse, weeklyResponse, monthlyResponse] = await Promise.all([
            apiRequest('GET', `/api/leaderboard?period=all-time&limit=${limit}`),
            apiRequest('GET', `/api/leaderboard?period=weekly&limit=${limit}`),
            apiRequest('GET', `/api/leaderboard?period=monthly&limit=${limit}`)
          ]);
          
          const allTimeData = await allTimeResponse.json();
          const weeklyData = await weeklyResponse.json();
          const monthlyData = await monthlyResponse.json();
          
          // تمييز المستخدم الحالي
          if (user && showCurrentUserHighlight) {
            allTimeData.forEach((u: LeaderboardUser) => {
              u.isCurrentUser = u.id === user.id;
            });
            
            weeklyData.forEach((u: LeaderboardUser) => {
              u.isCurrentUser = u.id === user.id;
            });
            
            monthlyData.forEach((u: LeaderboardUser) => {
              u.isCurrentUser = u.id === user.id;
            });
          }
          
          setLeaderboard(allTimeData);
          setWeeklyLeaderboard(weeklyData);
          setMonthlyLeaderboard(monthlyData);
        } catch (error) {
          console.error('Error fetching leaderboard data:', error);
          
          // إذا فشل الطلب، استخدم بيانات عرض توضيحية
          // هذه البيانات تستخدم فقط للعرض وسيتم استبدالها بالبيانات الفعلية عند توفر الواجهة
          const demoUsers = [
            { 
              id: 1, 
              username: 'beachfanatic', 
              firstName: 'أحمد', 
              lastName: 'محمد', 
              rewardPoints: 1250, 
              rank: 1, 
              badgeCount: 8, 
              level: 5,
              isCurrentUser: user && user.id === 1
            },
            { 
              id: 2, 
              username: 'travellover', 
              firstName: 'سارة', 
              lastName: 'أحمد', 
              rewardPoints: 980, 
              rank: 2, 
              badgeCount: 6, 
              level: 4,
              isCurrentUser: user && user.id === 2
            },
            { 
              id: 3, 
              username: 'explorerguy', 
              firstName: 'محمد', 
              lastName: 'علي', 
              rewardPoints: 875, 
              rank: 3, 
              badgeCount: 5, 
              level: 4,
              isCurrentUser: user && user.id === 3
            },
            { 
              id: 4, 
              username: 'northcoastfan', 
              firstName: 'فاطمة', 
              lastName: 'خالد', 
              rewardPoints: 720, 
              rank: 4, 
              badgeCount: 4, 
              level: 3,
              isCurrentUser: user && user.id === 4
            },
            { 
              id: 5, 
              username: 'luxurystays', 
              firstName: 'عمر', 
              lastName: 'محمود', 
              rewardPoints: 650, 
              rank: 5, 
              badgeCount: 3, 
              level: 3,
              isCurrentUser: user && user.id === 5
            }
          ];
          
          // إضافة المستخدم الحالي إذا لم يكن موجودًا
          if (user && !demoUsers.some(u => u.id === user.id) && showCurrentUserHighlight) {
            demoUsers.push({
              id: user.id,
              username: user.username,
              firstName: user.firstName || 'مستخدم',
              lastName: user.lastName || 'جديد',
              rewardPoints: user.rewardPoints || 100,
              rank: demoUsers.length + 1,
              badgeCount: 1,
              level: 1,
              isCurrentUser: true
            });
          }
          
          setLeaderboard(demoUsers);
          setWeeklyLeaderboard([...demoUsers].sort((a, b) => (0.5 - Math.random()) * 200));
          setMonthlyLeaderboard([...demoUsers].sort((a, b) => (0.5 - Math.random()) * 200));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, [user, limit, showCurrentUserHighlight]);
  
  const getActiveLeaderboard = () => {
    switch (activeTab) {
      case 'weekly':
        return weeklyLeaderboard;
      case 'monthly':
        return monthlyLeaderboard;
      default:
        return leaderboard;
    }
  };
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-green-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-green-700" />;
      default:
        return <span className="text-muted-foreground font-mono w-5 h-5 flex items-center justify-center">{rank}</span>;
    }
  };
  
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 2:
        return 'bg-green-100 text-green-800 border-green-300';
      case 3:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 4:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 5:
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'MU';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-grow">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-green-500" />
          لوحة المتصدرين
        </CardTitle>
        <CardDescription>
          تعرف على ترتيبك بين مستخدمي StayChill وتنافس للوصول إلى القمة
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showTabs && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="all-time" className="flex-1">كل الأوقات</TabsTrigger>
              <TabsTrigger value="monthly" className="flex-1">الشهر الحالي</TabsTrigger>
              <TabsTrigger value="weekly" className="flex-1">الأسبوع الحالي</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        <div className="space-y-4">
          {getActiveLeaderboard().map((userData) => (
            <div 
              key={userData.id} 
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                userData.isCurrentUser ? 'bg-blue-50 border border-blue-100' : ''
              }`}
            >
              <div className="flex-shrink-0 w-8 flex justify-center">
                {getRankIcon(userData.rank)}
              </div>
              
              <Avatar className="flex-shrink-0">
                <AvatarImage src={userData.avatarUrl} alt={userData.username} />
                <AvatarFallback>
                  {getInitials(userData.firstName, userData.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-grow">
                <div className="flex items-center">
                  <p className="font-medium text-sm">
                    {userData.firstName} {userData.lastName}
                  </p>
                  {userData.isCurrentUser && (
                    <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{userData.username}</p>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-bold text-sm">{userData.rewardPoints}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={`text-xs py-0 h-5 ${getLevelColor(userData.level)}`}>
                    <span className="ml-0.5">م</span>
                    {userData.level}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs py-0 h-5 bg-green-50 text-green-800 border-green-200">
                    <Award className="h-3 w-3 ml-0.5" />
                    {userData.badgeCount}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardSystem;