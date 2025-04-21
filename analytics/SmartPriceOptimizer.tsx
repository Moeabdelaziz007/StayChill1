
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { PropertyAnalytics } from '@/hooks/usePropertyAnalytics';

interface SmartPriceOptimizerProps {
  analytics: PropertyAnalytics;
}

export function SmartPriceOptimizer({ analytics }: SmartPriceOptimizerProps) {
  const [priceRecommendations, setPriceRecommendations] = useState<{
    basePrice: number;
    peakSeasonPrice: number;
    lowSeasonPrice: number;
    weekendPremium: number;
  }>({
    basePrice: analytics.overview.avgBookingValue,
    peakSeasonPrice: 0,
    lowSeasonPrice: 0,
    weekendPremium: 0
  });

  useEffect(() => {
    // Calculate optimized prices based on analytics
    const calculateOptimizedPrices = () => {
      const basePrice = analytics.overview.avgBookingValue;
      setPriceRecommendations({
        basePrice,
        peakSeasonPrice: basePrice * 1.3,
        lowSeasonPrice: basePrice * 0.8,
        weekendPremium: basePrice * 1.15
      });
    };

    calculateOptimizedPrices();
  }, [analytics]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Price Optimizer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium">Base Price</p>
              <p className="text-2xl font-bold">${priceRecommendations.basePrice}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium">Peak Season</p>
              <p className="text-2xl font-bold">${priceRecommendations.peakSeasonPrice}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium">Low Season</p>
              <p className="text-2xl font-bold">${priceRecommendations.lowSeasonPrice}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium">Weekend Rate</p>
              <p className="text-2xl font-bold">${priceRecommendations.weekendPremium}</p>
            </div>
          </div>
          <Button className="w-full">Apply Recommended Prices</Button>
        </div>
      </CardContent>
    </Card>
  );
}
