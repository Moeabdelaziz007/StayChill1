import { useRewards } from "@/hooks/useRewards";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertCircle, 
  Award, 
  Calendar, 
  Gift, 
  TrendingUp 
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const RewardStats = () => {
  const { getRewardStats, getUpcomingExpirations } = useRewards();
  const { 
    data: stats, 
    isLoading: isStatsLoading 
  } = getRewardStats();
  
  const { 
    data: expiringRewards = [], 
    isLoading: isExpiringLoading 
  } = getUpcomingExpirations();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Reward Statistics</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isStatsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalEarned.toLocaleString()} points</p>
                <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Gift className="mr-2 h-5 w-5 text-blue-500" />
                  Total Redeemed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalRedeemed.toLocaleString()} points</p>
                <p className="text-sm text-gray-500 mt-1">Points spent on rewards</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Award className="mr-2 h-5 w-5 text-brand" />
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalAvailable.toLocaleString()} points</p>
                <p className="text-sm text-gray-500 mt-1">Current balance</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Expiring Points Alert */}
      {!isExpiringLoading && !isStatsLoading && stats && stats.expiringPoints && stats.expiringPoints > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Points Expiring Soon</AlertTitle>
          <AlertDescription className="flex flex-col space-y-1">
            <span>
              You have <strong>{stats.expiringPoints.toLocaleString()}</strong> points 
              expiring {stats.expiringDate && 
                `in ${formatDistanceToNow(new Date(stats.expiringDate))}`
              }
            </span>
            <span className="text-sm">
              Use your points before they expire to get exclusive benefits!
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Upcoming Expirations */}
      {!isExpiringLoading && expiringRewards.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Upcoming Point Expirations
          </h3>
          <div className="space-y-3">
            {expiringRewards.map((reward) => (
              <Card key={reward.id} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{reward.points.toLocaleString()} points</p>
                      <p className="text-sm text-gray-500">{reward.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-500">
                        Expires {formatDistanceToNow(new Date(reward.expiryDate!))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(reward.expiryDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatsCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center">
        <Skeleton className="h-5 w-5 mr-2" />
        <Skeleton className="h-5 w-24" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-24" />
    </CardContent>
  </Card>
);

export default RewardStats;