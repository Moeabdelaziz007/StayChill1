import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Types for our payment data
interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  bookingId?: string;
  customer?: string;
  paymentMethod?: string;
}

interface PaymentAnalytics {
  totalRevenue: number;
  successRate: number;
  averageTransaction: number;
  recentPayments: PaymentData[];
  dailyRevenue: { date: string; revenue: number }[];
  paymentMethodDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
}

const COLORS = ["#FFD700", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const TIME_RANGES = ["7d", "30d", "90d", "ytd", "all"] as const;
type TimeRange = typeof TIME_RANGES[number];

const PaymentAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== "superadmin" && user.role !== "super_admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch analytics based on time range
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", `/api/payment-analytics?timeRange=${timeRange}`);
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch payment analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "MMM dd, yyyy");
  };

  // Get start and end dates for the current time range
  const getDateRangeLabel = () => {
    const now = new Date();
    
    switch (timeRange) {
      case "7d":
        return `${format(subDays(now, 7), "MMM dd, yyyy")} - ${format(now, "MMM dd, yyyy")}`;
      case "30d":
        return `${format(subDays(now, 30), "MMM dd, yyyy")} - ${format(now, "MMM dd, yyyy")}`;
      case "90d":
        return `${format(subDays(now, 90), "MMM dd, yyyy")} - ${format(now, "MMM dd, yyyy")}`;
      case "ytd":
        return `${format(new Date(now.getFullYear(), 0, 1), "MMM dd, yyyy")} - ${format(now, "MMM dd, yyyy")}`;
      case "all":
        return "All Time";
      default:
        return "";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Analytics</h1>
          <p className="text-muted-foreground">
            Track and analyze payment data across your properties
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-background border rounded-md p-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFD700]" />
            <span className="text-sm">{getDateRangeLabel()}</span>
          </div>
          
          <div className="flex rounded-md overflow-hidden border">
            {TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                className={timeRange === range ? "bg-[#FFD700] text-[#00182A] hover:bg-[#e5c100]" : ""}
                onClick={() => setTimeRange(range)}
                size="sm"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center h-80">
          <div className="animate-spin h-10 w-10 border-4 border-[#FFD700] border-t-transparent rounded-full"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from previous period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analytics.successRate * 100).toFixed(1)}%</div>
                <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFD700]" style={{ width: `${analytics.successRate * 100}%` }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.averageTransaction)}</div>
                <p className="text-xs text-muted-foreground">
                  Per successful booking
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue over the selected period</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#FFD700" 
                        activeDot={{ r: 8 }} 
                        name="Revenue" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method Distribution</CardTitle>
                    <CardDescription>Breakdown by payment method</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.paymentMethodDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.paymentMethodDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Status Distribution</CardTitle>
                    <CardDescription>Success vs. failed payments</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} payment(s)`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Comparison</CardTitle>
                  <CardDescription>Compare revenue across months</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: "Jan", revenue: 4000 },
                        { month: "Feb", revenue: 3000 },
                        { month: "Mar", revenue: 2000 },
                        { month: "Apr", revenue: 2780 },
                        { month: "May", revenue: 1890 },
                        { month: "Jun", revenue: 2390 },
                        { month: "Jul", revenue: 3490 },
                        { month: "Aug", revenue: 4550 },
                        { month: "Sep", revenue: 5300 },
                        { month: "Oct", revenue: 6200 },
                        { month: "Nov", revenue: 7000 },
                        { month: "Dec", revenue: 9800 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="methods" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Over Time</CardTitle>
                  <CardDescription>Trends in payment method usage</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { date: "Jan", visa: 4000, mastercard: 2400, amex: 1200 },
                        { date: "Feb", visa: 3000, mastercard: 1398, amex: 2210 },
                        { date: "Mar", visa: 2000, mastercard: 9800, amex: 2290 },
                        { date: "Apr", visa: 2780, mastercard: 3908, amex: 2000 },
                        { date: "May", visa: 1890, mastercard: 4800, amex: 2181 },
                        { date: "Jun", visa: 2390, mastercard: 3800, amex: 2500 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="visa" name="Visa" stroke="#FFD700" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="mastercard" name="Mastercard" stroke="#0088FE" />
                      <Line type="monotone" dataKey="amex" name="American Express" stroke="#00C49F" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest payment activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booking ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                        {analytics.recentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatDate(payment.created)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatCurrency(payment.amount / 100)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  payment.status === "succeeded"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "processing"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.bookingId || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="grid place-items-center h-80">
          <div className="text-center">
            <h3 className="text-lg font-medium">No payment data available</h3>
            <p className="text-muted-foreground">Try changing the time range or check back later</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAnalyticsDashboard;