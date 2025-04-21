import { useEffect, useState } from 'react';
import { BrainCircuit, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyAnalytics } from '@/hooks/usePropertyAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

// Types for AI-generated insights
export interface AIInsight {
  id: string;
  type: 'optimization' | 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionItems?: string[];
}

interface SmartInsightsProps {
  analytics: PropertyAnalytics;
  isLoading?: boolean;
}

export function SmartInsights({ analytics, isLoading = false }: SmartInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (analytics && !isLoading) {
      generateInsights();
    }
  }, [analytics, isLoading]);

  // This function simulates AI insight generation
  // In a real implementation, this would call the Gemini API
  const generateInsights = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newInsights: AIInsight[] = [];
      
      // Generate insights based on analytics data
      
      // Occupancy insights
      if (analytics.overview.occupancyRate < 50) {
        newInsights.push({
          id: 'occupancy-low',
          type: 'warning',
          title: 'Low Occupancy Rate',
          description: `Your property's ${analytics.overview.occupancyRate.toFixed(1)}% occupancy rate is below target. Based on market data for similar properties in ${analytics.propertyTitle.split(' ')[0]}, you could aim for 65-75%.`,
          confidence: 85,
          actionItems: [
            'Consider dynamic pricing during weekdays to attract more guests',
            'Highlight unique amenities in your property description',
            'Offer special rates for extended stays (7+ days)'
          ]
        });
      } else if (analytics.overview.occupancyRate > 80) {
        newInsights.push({
          id: 'occupancy-high',
          type: 'opportunity',
          title: 'High Demand Property',
          description: `Your excellent ${analytics.overview.occupancyRate.toFixed(1)}% occupancy rate indicates strong demand. This suggests an opportunity for revenue optimization.`,
          confidence: 90,
          actionItems: [
            'Consider increasing your nightly rate by 10-15%',
            'Implement premium pricing for high-demand dates',
            'Add premium services or amenities with add-on pricing'
          ]
        });
      }
      
      // Pricing insights
      if (analytics.overview.avgBookingValue < 1000) {
        newInsights.push({
          id: 'price-low',
          type: 'optimization',
          title: 'Revenue Optimization',
          description: `Your average booking value of ${analytics.overview.avgBookingValue.toFixed(2)} USD is below market average. Properties with similar features in this area average 15-20% higher rates.`,
          confidence: 75,
          actionItems: [
            'Update your property photos to better showcase premium features',
            'Add more unique experiences or services to justify higher pricing',
            'Gradually increase pricing for new bookings by 5-10%'
          ]
        });
      }
      
      // Seasonal trends
      if (analytics.bookings.length > 5) {
        // Check if there are patterns in the booking data
        newInsights.push({
          id: 'seasonal-trend',
          type: 'trend',
          title: 'Seasonal Booking Pattern Detected',
          description: 'AI analysis shows a booking pattern that suggests seasonal demand fluctuations. Bookings increase significantly during certain months.',
          confidence: 80,
          actionItems: [
            'Implement seasonal pricing strategies with higher rates during peak periods',
            'Consider offering special packages during lower-demand periods',
            'Plan maintenance and improvements during identified low seasons'
          ]
        });
      }
      
      // Review insights
      if (analytics.overview.reviewsCount > 0) {
        if (analytics.overview.avgRating < 4.2) {
          newInsights.push({
            id: 'rating-improvement',
            type: 'warning',
            title: 'Rating Improvement Needed',
            description: `Your average rating of ${analytics.overview.avgRating.toFixed(1)} is below the platform average of 4.5. Improving your rating could increase bookings by up to 25%.`,
            confidence: 85,
            actionItems: [
              'Address common feedback points in recent reviews',
              'Improve check-in experience based on guest comments',
              'Consider adding small welcome amenities to enhance first impressions'
            ]
          });
        } else if (analytics.overview.avgRating >= 4.7) {
          newInsights.push({
            id: 'rating-excellent',
            type: 'opportunity',
            title: 'Excellent Rating - Marketing Opportunity',
            description: `Your outstanding ${analytics.overview.avgRating.toFixed(1)} rating places you in the top 15% of properties. This is a strong marketing advantage.`,
            confidence: 95,
            actionItems: [
              'Highlight your top rating in your property title and description',
              'Consider applying for "Featured Property" status',
              'Share guest testimonials on your social media channels'
            ]
          });
        }
      }
      
      setInsights(newInsights);
      setIsGenerating(false);
    }, 1000); // Simulate 1-second API call
  };

  if (isLoading || isGenerating) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand" />
            <CardTitle>AI-Powered Insights</CardTitle>
          </div>
          <CardDescription>Loading intelligent analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-3">
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Map icons to insight types
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <Lightbulb className="h-4 w-4 text-green-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-brand" />;
    }
  };

  // Map colors to confidence levels
  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 85) return 'default';
    if (confidence >= 70) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand" />
            <CardTitle>AI-Powered Insights</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateInsights}
            className="h-8"
          >
            Refresh
          </Button>
        </div>
        <CardDescription>
          Smart recommendations based on your property data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No insights available for the current data range.</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={generateInsights}
              className="mt-2"
            >
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="p-4 border rounded-lg bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </h4>
                  <Badge variant={getConfidenceBadgeVariant(insight.confidence)}>
                    {insight.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.description}
                </p>
                {insight.actionItems && insight.actionItems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                      {insight.actionItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}