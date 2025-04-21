import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon,
  BarChart3,
  TrendingUp,
  Users,
  Star,
  Building,
  DollarSign,
  Download,
  Share2,
  Printer,
  RefreshCw,
  BrainCircuit,
  Lightbulb,
  SparkleIcon
} from 'lucide-react';
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useProperties';
import { usePropertyAnalytics } from '@/hooks/usePropertyAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import AdminLayout from '@/components/layout/AdminLayout';
import { SmartInsights } from '@/components/analytics/SmartInsights';
import { AITrendPredictor } from '@/components/analytics/AITrendPredictor';

export default function PropertyAnalytics({ propertyId: initialPropertyId }: { propertyId?: number }) {
  const [match, params] = useRoute('/property/:id/analytics');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getUserProperties } = useProperties();
  const { getPropertyAnalytics, setDateRange, startDate, endDate } = usePropertyAnalytics();
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(initialPropertyId || null);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  
  const {
    data: userProperties,
    isLoading: propertiesLoading,
    error: propertiesError
  } = getUserProperties();
  
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = getPropertyAnalytics(selectedPropertyId || 0);
  
  // Handle property ID from URL or props
  useEffect(() => {
    const getValidPropertyId = () => {
      // First priority: initialPropertyId from props
      if (initialPropertyId && !isNaN(initialPropertyId) && initialPropertyId > 0) {
        return initialPropertyId;
      }
      
      // Second priority: URL parameter
      if (match && params?.id) {
        const idFromUrl = parseInt(params.id);
        if (!isNaN(idFromUrl) && idFromUrl > 0) {
          return idFromUrl;
        }
      }
      
      // Third priority: First property from user's properties
      if (userProperties && userProperties.length > 0) {
        return userProperties[0].id;
      }
      
      // No valid property ID found
      return null;
    };
    
    const propertyId = getValidPropertyId();
    
    // Only update if we have a valid ID and it's different from current selection
    if (propertyId !== null && propertyId !== selectedPropertyId) {
      setSelectedPropertyId(propertyId);
    }
  }, [match, params?.id, userProperties, initialPropertyId, selectedPropertyId]);
  
  // Refresh analytics when date range or property changes
  useEffect(() => {
    if (selectedPropertyId && selectedPropertyId > 0) {
      refetchAnalytics().catch(error => {
        // Keep console.error for debugging critical errors
        console.error('Error refetching analytics:', error);
        toast({
          title: 'Refresh Error',
          description: 'Failed to refresh analytics data. Please try again.',
          variant: 'destructive',
        });
      });
    }
  }, [selectedPropertyId, startDate, endDate, refetchAnalytics, toast]);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please login to view property analytics</p>
      </div>
    );
  }
  
  if (user.role !== 'propertyadmin' && user.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>You don't have permission to access this page</p>
      </div>
    );
  }
  
  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    if (start && end) {
      setDateRange(start, end);
    }
  };
  
  const propertyOptions = userProperties?.map(property => ({
    id: property.id,
    title: property.title
  })) || [];
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };
  
  // Generate chart data from bookings
  const generateBookingChartData = () => {
    if (!analytics?.bookings) return [];
    
    const bookingsByMonth: Record<string, { date: string, bookings: number, revenue: number }> = {};
    
    analytics.bookings.forEach(booking => {
      const date = new Date(booking.startDate);
      const monthYear = format(date, 'MMM yyyy');
      
      if (!bookingsByMonth[monthYear]) {
        bookingsByMonth[monthYear] = {
          date: monthYear,
          bookings: 0,
          revenue: 0
        };
      }
      
      bookingsByMonth[monthYear].bookings += 1;
      bookingsByMonth[monthYear].revenue += booking.totalPrice;
    });
    
    return Object.values(bookingsByMonth).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  // Export analytics data to CSV
  const exportToCsv = () => {
    if (!analytics) return;
    
    try {
      // Create headers
      const headers = ['Date Range', `${formatDate(analytics.dateRange.startDate)} - ${formatDate(analytics.dateRange.endDate)}`];
      const overviewHeaders = ['Total Bookings', 'Total Revenue', 'Average Booking Value', 'Occupancy Rate', 'Reviews Count', 'Average Rating'];
      const bookingHeaders = ['Booking ID', 'Start Date', 'End Date', 'Guests', 'Total Price', 'Status', 'Points Earned'];
      
      // Create overview data
      const overviewData = [
        analytics.overview.totalBookings,
        formatCurrency(analytics.overview.totalRevenue),
        formatCurrency(analytics.overview.avgBookingValue),
        `${analytics.overview.occupancyRate.toFixed(1)}%`,
        analytics.overview.reviewsCount,
        analytics.overview.avgRating.toFixed(1)
      ];
      
      // Create bookings data
      const bookingsData = analytics.bookings.map(booking => [
        booking.id,
        formatDate(booking.startDate),
        formatDate(booking.endDate),
        booking.guestCount,
        formatCurrency(booking.totalPrice),
        booking.status,
        booking.pointsEarned || 0
      ]);
      
      // Combine all data
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add property info
      csvContent += `Property Analytics: ${analytics.propertyTitle} (ID: ${analytics.propertyId})\r\n\r\n`;
      
      // Add date range
      csvContent += headers.join(',') + '\r\n\r\n';
      
      // Add overview section
      csvContent += 'Overview\r\n';
      csvContent += overviewHeaders.join(',') + '\r\n';
      csvContent += overviewData.join(',') + '\r\n\r\n';
      
      // Add bookings section
      csvContent += 'Bookings\r\n';
      csvContent += bookingHeaders.join(',') + '\r\n';
      bookingsData.forEach(row => {
        csvContent += row.join(',') + '\r\n';
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `property_analytics_${analytics.propertyId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      
      // Trigger download and clean up
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Analytics data has been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Property Analytics</h1>
            <p className="text-muted-foreground">
              Track performance metrics for your properties
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full min-w-[200px] lg:min-w-[300px]">
              {propertiesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select 
                  className="w-full px-3 py-2 rounded-md border border-input bg-background appearance-none cursor-pointer pr-10"
                  value={selectedPropertyId || ''}
                  onChange={(e) => setSelectedPropertyId(parseInt(e.target.value))}
                  disabled={propertiesLoading}
                >
                  {propertyOptions.length === 0 ? (
                    <option value="">No properties available</option>
                  ) : (
                    propertyOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))
                  )}
                </select>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[230px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate && endDate ? (
                      <>
                        {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                      </>
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={startDate}
                    selected={{
                      from: startDate,
                      to: endDate
                    }}
                    onSelect={(range) => {
                      handleDateRangeChange(range?.from, range?.to);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Action buttons toolbar */}
        {!analyticsLoading && !analyticsError && analytics && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => refetchAnalytics()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={exportToCsv}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.print()}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                try {
                  navigator.share({
                    title: `StayChill Analytics: ${analytics.propertyTitle}`,
                    text: `Property analytics for ${analytics.propertyTitle} from ${formatDate(analytics.dateRange.startDate)} to ${formatDate(analytics.dateRange.endDate)}`
                  }).catch(() => {
                    // Silent catch - already handled by toast in outer catch block
                  });
                } catch (error) {
                  toast({
                    title: "Sharing not supported",
                    description: "This browser does not support the share functionality",
                    variant: "destructive",
                  });
                }
              }}
              className="flex items-center gap-1"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        )}
        
        {analyticsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-4 w-40 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyticsError ? (
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-red-700">Error loading analytics: {(analyticsError as Error).message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAnalytics()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : analytics ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <BarChart3 className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    For period {formatDate(analytics.dateRange.startDate)} - {formatDate(analytics.dateRange.endDate)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg. {formatCurrency(analytics.overview.avgBookingValue)} per booking
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                  <Building className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.occupancyRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Percentage of days booked in the selected period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                  <Star className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.reviewsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Average rating: {analytics.overview.avgRating.toFixed(1)}/5
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="overview" className="w-full" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-1">
                  <BrainCircuit className="h-4 w-4" />
                  <span>AI Insights</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking History</CardTitle>
                    <CardDescription>Bookings and revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {generateBookingChartData().length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground">No booking data available for the selected period</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={generateBookingChartData()}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fill: 'var(--foreground)' }}
                              tickLine={{ stroke: 'var(--foreground)' }}
                              axisLine={{ stroke: 'var(--foreground)' }}
                            />
                            <YAxis 
                              yAxisId="left" 
                              tick={{ fill: 'var(--foreground)' }}
                              tickLine={{ stroke: 'var(--foreground)' }}
                              axisLine={{ stroke: 'var(--foreground)' }}
                              label={{ 
                                value: 'Bookings', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { textAnchor: 'middle', fill: 'var(--foreground)' } 
                              }}
                            />
                            <YAxis 
                              yAxisId="right" 
                              orientation="right"
                              tick={{ fill: 'var(--foreground)' }}
                              tickLine={{ stroke: 'var(--foreground)' }}
                              axisLine={{ stroke: 'var(--foreground)' }}
                              label={{ 
                                value: 'Revenue ($)', 
                                angle: 90, 
                                position: 'insideRight',
                                style: { textAnchor: 'middle', fill: 'var(--foreground)' } 
                              }}
                            />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'revenue') return ['$' + value, 'Revenue'];
                                return [value, 'Bookings'];
                              }}
                              contentStyle={{
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)'
                              }}
                            />
                            <Legend 
                              formatter={(value) => {
                                return value.charAt(0).toUpperCase() + value.slice(1);
                              }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="bookings"
                              name="bookings"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ r: 4, strokeWidth: 2 }}
                              activeDot={{ r: 8 }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="revenue"
                              name="revenue"
                              stroke="hsl(var(--secondary))"
                              strokeWidth={2}
                              dot={{ r: 4, strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Performance</CardTitle>
                      <CardDescription>Key metrics comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Occupancy Rate</span>
                          <span className="text-sm font-medium">{analytics.overview.occupancyRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${analytics.overview.occupancyRate}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Rating</span>
                          <span className="text-sm font-medium">{analytics.overview.avgRating.toFixed(1)}/5</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(analytics.overview.avgRating / 5) * 100}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Booking Conversion</span>
                          <span className="text-sm font-medium">67%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Insights</CardTitle>
                      <CardDescription>Recommendations based on analytics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.overview.occupancyRate < 50 && (
                          <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-yellow-600" />
                              Improve Occupancy Rate
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Your occupancy rate is below 50%. Consider adjusting pricing or adding promotions during low-demand periods.
                            </p>
                          </div>
                        )}
                        
                        {analytics.overview.avgRating < 4.0 && (
                          <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-600" />
                              Improve Guest Experience
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Your average rating is below 4.0. Review guest feedback and address common concerns to improve satisfaction.
                            </p>
                          </div>
                        )}
                        
                        {analytics.overview.occupancyRate >= 50 && analytics.overview.avgRating >= 4.0 && (
                          <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              Revenue Opportunity
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Your property is performing well! Consider raising rates during peak periods to maximize revenue.
                            </p>
                          </div>
                        )}
                        
                        <div className="p-4 border rounded-lg bg-background">
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            Property Maintenance
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Regular maintenance keeps your property attractive to guests. Schedule your next maintenance during low-occupancy periods.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>
                      Showing {analytics.bookings.length} bookings for the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Guests</TableHead>
                          <TableHead>Total Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.bookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No bookings found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          analytics.bookings.map(booking => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">#{booking.id}</TableCell>
                              <TableCell>
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                              </TableCell>
                              <TableCell>{booking.guestCount}</TableCell>
                              <TableCell>{formatCurrency(booking.totalPrice)}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  booking.status === 'completed' ? 'default' :
                                  booking.status === 'pending' ? 'outline' :
                                  booking.status === 'canceled' ? 'destructive' : 'secondary'
                                }>
                                  {booking.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Guest Reviews</CardTitle>
                    <CardDescription>
                      {analytics.reviews.length} reviews with average rating {analytics.overview.avgRating.toFixed(1)}/5
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No reviews available for this property</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[1, 2, 3, 4, 5].map(rating => {
                                const count = analytics.reviews.filter(r => Math.round(r.rating) === rating).length;
                                return {
                                  rating: `${rating} Star${rating !== 1 ? 's' : ''}`,
                                  count
                                };
                              })}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="rating" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="count" fill="#8884d8" name="Reviews" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid gap-4">
                          {analytics.reviews.map(review => (
                            <Card key={review.id}>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(review.createdAt)}
                                  </span>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {review.comment ? (
                                  <p className="text-sm">{review.comment}</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No comment provided</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="ai-insights">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-brand" />
                        AI-Powered Analytics
                      </h3>
                      <p className="text-muted-foreground">
                        Intelligent insights powered by Gemini AI technology
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <SmartInsights 
                      analytics={analytics} 
                      isLoading={analyticsLoading} 
                    />
                    
                    <AITrendPredictor 
                      analytics={analytics}
                      isLoading={analyticsLoading}
                    />
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>About AI Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Our AI-powered analytics uses advanced machine learning algorithms to analyze your property performance data and generate actionable insights.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-green-500" />
                              Smart Insights
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              AI identifies patterns and opportunities for optimizing your property's performance.
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Predictive Analytics
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Forecast upcoming trends and booking patterns to help you plan ahead.
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              Guest Sentiment Analysis
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Understand guest feedback at a deeper level to improve satisfaction.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}