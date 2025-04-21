import { useState, useEffect } from 'react';
import { CircleDashed, SparkleIcon, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PropertyAnalytics } from '@/hooks/usePropertyAnalytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface AITrendPredictorProps {
  analytics: PropertyAnalytics;
  isLoading?: boolean;
  timeframe?: 'short' | 'medium' | 'long';
}

// Type for trend prediction
interface TrendPrediction {
  period: string; // e.g., "Jun 2023"
  bookings: number;
  revenue: number;
  isProjected: boolean;
}

interface PredictionExplanation {
  key: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 1-10, importance in prediction
}

export function AITrendPredictor({ 
  analytics, 
  isLoading = false,
  timeframe = 'medium'
}: AITrendPredictorProps) {
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [explanations, setExplanations] = useState<PredictionExplanation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (analytics && !isLoading) {
      generatePredictions();
    }
  }, [analytics, isLoading, selectedTimeframe]);

  // This function simulates AI prediction generation
  // In a real implementation, this would call the Gemini API
  const generatePredictions = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Extract past data from analytics to use as baseline
      const historicalData: TrendPrediction[] = [];
      
      // Generate some historical data points based on bookings
      if (analytics.bookings.length > 0) {
        // Group bookings by month
        const monthlyData: Record<string, { bookings: number, revenue: number }> = {};
        
        analytics.bookings.forEach(booking => {
          const date = new Date(booking.startDate);
          const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { bookings: 0, revenue: 0 };
          }
          
          monthlyData[monthYear].bookings += 1;
          monthlyData[monthYear].revenue += booking.totalPrice;
        });
        
        // Convert to array and sort chronologically
        Object.entries(monthlyData).forEach(([period, data]) => {
          historicalData.push({
            period,
            bookings: data.bookings,
            revenue: data.revenue,
            isProjected: false
          });
        });
      } else {
        // If no real data, create placeholder historical data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
        const currentYear = new Date().getFullYear();
        
        months.forEach((month, index) => {
          const baseBookings = 5 + Math.floor(Math.random() * 5);
          const baseRevenue = baseBookings * analytics.overview.avgBookingValue;
          
          historicalData.push({
            period: `${month} ${currentYear}`,
            bookings: baseBookings,
            revenue: baseRevenue,
            isProjected: false
          });
        });
      }
      
      // Sort historical data
      historicalData.sort((a, b) => {
        const dateA = new Date(a.period);
        const dateB = new Date(b.period);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Generate future predictions based on historical trends
      const futurePredictions: TrendPrediction[] = [];
      const lastHistoricalData = historicalData[historicalData.length - 1];
      
      // Determine number of months to project based on timeframe
      let monthsToProject = 3; // Default medium
      if (selectedTimeframe === 'short') {
        monthsToProject = 2;
      } else if (selectedTimeframe === 'long') {
        monthsToProject = 6;
      }
      
      // Generate future dates
      const lastDate = new Date(lastHistoricalData.period);
      for (let i = 1; i <= monthsToProject; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setMonth(lastDate.getMonth() + i);
        
        // Calculate trend-based values with some variability
        let projectedBookings = lastHistoricalData.bookings;
        let projectedRevenue = lastHistoricalData.revenue;
        
        // Apply seasonal variations and trends
        const month = futureDate.getMonth();
        const isSummer = month >= 5 && month <= 8; // June to September
        const isWinter = month === 11 || month === 0 || month === 1; // Dec to Feb
        
        // Apply seasonal multipliers
        if (isSummer) {
          projectedBookings *= 1.3 + (Math.random() * 0.2); // Summer boost
          projectedRevenue *= 1.4 + (Math.random() * 0.2); // Higher rates in summer
        } else if (isWinter) {
          projectedBookings *= 0.8 + (Math.random() * 0.2); // Winter slow season
          projectedRevenue *= 0.85 + (Math.random() * 0.2); // Lower rates in winter
        } else {
          projectedBookings *= 1 + ((Math.random() * 0.3) - 0.15); // Normal variation
          projectedRevenue *= 1 + ((Math.random() * 0.3) - 0.1); // Normal variation
        }
        
        // Round values
        projectedBookings = Math.round(projectedBookings);
        projectedRevenue = Math.round(projectedRevenue);
        
        futurePredictions.push({
          period: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          bookings: projectedBookings,
          revenue: projectedRevenue,
          isProjected: true
        });
      }
      
      // Generate explanations for the predictions
      const newExplanations: PredictionExplanation[] = [
        {
          key: 'seasonality',
          title: 'Seasonal Patterns',
          description: 'Historical booking data shows strong seasonal patterns with peaks during summer months and lower occupancy in winter.',
          impact: 'neutral',
          weight: 9
        },
        {
          key: 'market-trends',
          title: 'Market Growth',
          description: 'The overall market for vacation rentals in this region is projected to grow by 12-15% over the next year.',
          impact: 'positive',
          weight: 7
        }
      ];
      
      // Add some location-specific factors
      const locationName = analytics.propertyTitle.split(' ')[0];
      if (locationName === 'Beachfront' || locationName === 'Coastal') {
        newExplanations.push({
          key: 'location-premium',
          title: 'Premium Location Factor',
          description: 'Beachfront properties typically command 30-40% higher rates during peak season, which is reflected in revenue projections.',
          impact: 'positive',
          weight: 8
        });
      }
      
      // Add rating factor
      if (analytics.overview.avgRating > 4.5) {
        newExplanations.push({
          key: 'high-rating',
          title: 'Excellent Rating Impact',
          description: `Your ${analytics.overview.avgRating.toFixed(1)} rating is expected to generate 20% more interest than average properties, positively affecting booking rates.`,
          impact: 'positive',
          weight: 6
        });
      } else if (analytics.overview.avgRating < 4.0) {
        newExplanations.push({
          key: 'low-rating',
          title: 'Rating Improvement Opportunity',
          description: `The current ${analytics.overview.avgRating.toFixed(1)} rating may limit growth potential. Improving to 4.5+ could increase bookings by up to 25%.`,
          impact: 'negative',
          weight: 6
        });
      }
      
      // Add review volume factor
      if (analytics.overview.reviewsCount < 10) {
        newExplanations.push({
          key: 'review-volume',
          title: 'Limited Review History',
          description: 'Having fewer than 10 reviews may reduce booking confidence. Predictions assume gradual review growth over time.',
          impact: 'negative',
          weight: 4
        });
      }
      
      // Combine historical data with predictions
      const allData = [...historicalData, ...futurePredictions];
      
      setPredictions(allData);
      setExplanations(newExplanations);
      setIsGenerating(false);
    }, 1500); // Simulate 1.5-second API call
  };

  if (isLoading || isGenerating) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SparkleIcon className="h-5 w-5 text-brand" />
            <CardTitle>AI Trend Predictions</CardTitle>
          </div>
          <CardDescription>Generating intelligent forecast...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparkleIcon className="h-5 w-5 text-brand" />
            <CardTitle>AI Trend Predictions</CardTitle>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-md p-1">
              <Button 
                variant={selectedTimeframe === 'short' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedTimeframe('short')}
              >
                3mo
              </Button>
              <Button 
                variant={selectedTimeframe === 'medium' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedTimeframe('medium')}
              >
                6mo
              </Button>
              <Button 
                variant={selectedTimeframe === 'long' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedTimeframe('long')}
              >
                12mo
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <CardDescription>
          AI-powered booking and revenue projections
        </CardDescription>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>Insufficient historical data for prediction.</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={generatePredictions}
              className="mt-2"
            >
              Generate Sample Forecast
            </Button>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={predictions}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Bookings', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: 10 }
                    }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Revenue', 
                      angle: 90, 
                      position: 'insideRight',
                      style: { fontSize: 10 }
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                      return [value, 'Bookings'];
                    }}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="bookings" 
                    yAxisId="left"
                    stroke="#8884d8" 
                    fill="url(#colorBookings)" 
                    name="bookings"
                    dot={(props) => {
                      // Add special styling for projected data points
                      const { cx, cy, payload } = props;
                      if (payload.isProjected) {
                        return (
                          <circle cx={cx} cy={cy} r={4} fill="#8884d8" stroke="#fff" strokeWidth={1} />
                        );
                      }
                      return <circle cx={cx} cy={cy} r={3} fill="#8884d8" />;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    yAxisId="right"
                    stroke="#4CAF50" 
                    fill="url(#colorRevenue)" 
                    name="revenue"
                    dot={(props) => {
                      // Add special styling for projected data points
                      const { cx, cy, payload } = props;
                      if (payload.isProjected) {
                        return (
                          <circle cx={cx} cy={cy} r={4} fill="#4CAF50" stroke="#fff" strokeWidth={1} />
                        );
                      }
                      return <circle cx={cx} cy={cy} r={3} fill="#4CAF50" />;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {expanded && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                  Prediction Factors
                </h4>
                <Accordion type="single" collapsible className="w-full">
                  {explanations.map((exp) => (
                    <AccordionItem key={exp.key} value={exp.key}>
                      <AccordionTrigger className="text-sm hover:no-underline">
                        <div className="flex items-center">
                          <div 
                            className={`w-2 h-2 rounded-full mr-2 ${
                              exp.impact === 'positive' ? 'bg-green-500' :
                              exp.impact === 'negative' ? 'bg-red-500' :
                              'bg-amber-500'
                            }`} 
                          />
                          {exp.title}
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Weight: {exp.weight}/10)
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          {exp.description}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </>
        )}
      </CardContent>
      {!expanded && explanations.length > 0 && (
        <CardFooter className="pt-0 px-6 text-xs text-muted-foreground">
          <p>
            <span className="font-medium">Key factors: </span>
            {explanations.slice(0, 2).map((exp, i) => (
              <span key={exp.key}>
                {i > 0 && ", "}
                {exp.title}
              </span>
            ))}
            {explanations.length > 2 && ` and ${explanations.length - 2} more...`}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}