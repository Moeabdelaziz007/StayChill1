import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bell, 
  Calendar, 
  Tag, 
  Star, 
  Suitcase, 
  Map, 
  Clock, 
  Gift,
  X,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// واجهة لكائن الإشعار
interface Notification {
  id: string;
  type: 'booking_reminder' | 'offer' | 'reward' | 'system' | 'referral' | 'trip_tip' | 'welcome_back' | 'flash_sale';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  expiresAt?: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    bookingId?: number;
    offerCode?: string;
    pointsAmount?: number;
    locationName?: string;
    discount?: string;
    limitedTime?: boolean;
  };
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'booking_reminder':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'offer':
      return <Tag className="h-5 w-5 text-green-500" />;
    case 'reward':
      return <Star className="h-5 w-5 text-amber-500" />;
    case 'referral':
      return <Gift className="h-5 w-5 text-purple-500" />;
    case 'trip_tip':
      return <Suitcase className="h-5 w-5 text-indigo-500" />;
    case 'welcome_back':
      return <Map className="h-5 w-5 text-emerald-500" />;
    case 'flash_sale':
      return <Clock className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

// مكون الإشعارات المنبثقة
const NotificationPopover = ({ 
  isOpen, 
  onClose, 
  notifications, 
  markAsRead, 
  clearAllNotifications
}: { 
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}) => {
  if (!isOpen) return null;
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <Card className="z-50 w-full max-w-md max-h-[90vh] overflow-hidden">
        <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount} جديد
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              آخر التحديثات والإخطارات
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <ScrollArea className="h-96">
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium">لا توجد إشعارات</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ستظهر هنا جميع التحديثات والإشعارات المهمة
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                          <Badge variant="outline" className="text-xs ml-2">
                            {new Date(notification.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        
                        {notification.actionUrl && notification.actionText && (
                          <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                            {notification.actionText}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                        
                        {notification.type === 'flash_sale' && notification.expiresAt && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                            <Clock className="h-3 w-3" />
                            <span>ينتهي في {new Date(notification.expiresAt).toLocaleString('ar-EG')}</span>
                          </div>
                        )}
                        
                        {!notification.read && (
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-500 text-xs">
                              جديد
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </ScrollArea>
        
        <CardFooter className="p-3 flex justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            إغلاق
          </Button>
          
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllNotifications}>
              <Check className="h-4 w-4 mr-2" />
              تحديد الكل كمقروء
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

interface SmartNotificationSystemProps {
  variant?: 'bell' | 'badge' | 'drawer';
}

const SmartNotificationSystem = ({
  variant = 'bell'
}: SmartNotificationSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // جلب الإشعارات من الخادم
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/notifications');
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          // في حالة عدم توفر واجهة برمجة، استخدم بيانات توضيحية
          // هذه البيانات للعرض فقط وسيتم استبدالها ببيانات حقيقية من الخادم
          const demoNotifications: Notification[] = [
            {
              id: '1',
              type: 'booking_reminder',
              title: 'تذكير بالحجز القادم',
              message: 'لديك حجز في فيلا الشاطئ يبدأ غدًا. نتمنى لك إقامة ممتعة!',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              read: false,
              actionUrl: '/bookings/123',
              actionText: 'عرض تفاصيل الحجز',
              priority: 'high',
              metadata: {
                bookingId: 123
              }
            },
            {
              id: '2',
              type: 'offer',
              title: 'عرض خاص لك',
              message: 'احصل على خصم 15% على حجوزات عطلة نهاية الأسبوع في رأس الحكمة',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              read: false,
              actionUrl: '/offers/summer-weekend',
              actionText: 'استفد من العرض',
              priority: 'medium',
              metadata: {
                offerCode: 'WEEKEND15',
                locationName: 'رأس الحكمة',
                discount: '15%'
              }
            },
            {
              id: '3',
              type: 'reward',
              title: 'مكافأة جديدة!',
              message: 'لقد ربحت 100 نقطة ChillPoints من آخر حجز لك. استمر في جمع النقاط واستبدلها بمكافآت رائعة!',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              read: true,
              actionUrl: '/rewards',
              actionText: 'عرض رصيد النقاط',
              priority: 'medium',
              metadata: {
                pointsAmount: 100
              }
            },
            {
              id: '4',
              type: 'flash_sale',
              title: 'عرض فلاش! فرصة محدودة',
              message: 'خصم 25% على إقامة لمدة 3 ليالٍ في منتجع النخيل الفاخر في مارينا. العرض محدود بـ 24 ساعة فقط!',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              read: false,
              actionUrl: '/properties/flash-deal',
              actionText: 'احجز الآن',
              expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
              priority: 'high',
              metadata: {
                limitedTime: true,
                discount: '25%',
                locationName: 'مارينا'
              }
            },
            {
              id: '5',
              type: 'trip_tip',
              title: 'نصائح لرحلتك القادمة',
              message: 'الطقس في الساحل الشمالي سيكون مشمسًا خلال إقامتك. لا تنس احضار كريم الحماية من الشمس ونظارات شمسية!',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              read: true,
              priority: 'low'
            }
          ];
          
          setNotifications(demoNotifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // إعداد استطلاع للإشعارات الجديدة كل دقيقة
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  // الاستماع إلى الإشعارات الجديدة عبر websocket (يمكن تنفيذه لاحقًا)
  
  // تحديد الإشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    try {
      // محاولة تحديث حالة الإشعار على الخادم
      try {
        await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
      
      // تحديث حالة الإشعار محليًا
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // البحث عن الإشعار المحدد
      const notification = notifications.find(n => n.id === notificationId);
      
      // إذا كان يحتوي على رابط، قم بالتوجيه إليه
      if (notification?.actionUrl) {
        // في تطبيق حقيقي، ستستخدم التوجيه من مكتبة مثل react-router أو wouter
        window.location.href = notification.actionUrl;
      }
      
      // إغلاق القائمة المنبثقة
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  // تحديد جميع الإشعارات كمقروءة
  const clearAllNotifications = async () => {
    try {
      // محاولة تحديث حالة جميع الإشعارات على الخادم
      try {
        await apiRequest('POST', `/api/notifications/mark-all-read`);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
      
      // تحديث حالة الإشعارات محليًا
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        title: "تم تحديد جميع الإشعارات كمقروءة",
        description: `تم تحديث ${unreadCount} إشعارات`,
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };
  
  // إظهار إشعار منبثق للمستخدم (الإشعارات الفورية)
  const showNotificationToast = (notification: Notification) => {
    toast({
      title: notification.title,
      description: notification.message,
      action: notification.actionText ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAsRead(notification.id)}
        >
          {notification.actionText}
        </Button>
      ) : undefined,
    });
  };
  
  // عرض على شكل جرس
  if (variant === 'bell') {
    return (
      <>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="relative"
            aria-label="الإشعارات"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
        
        <NotificationPopover 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          notifications={notifications}
          markAsRead={markAsRead}
          clearAllNotifications={clearAllNotifications}
        />
      </>
    );
  }
  
  // عرض على شكل بادج
  if (variant === 'badge') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          الإشعارات
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </Button>
        
        <NotificationPopover 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          notifications={notifications}
          markAsRead={markAsRead}
          clearAllNotifications={clearAllNotifications}
        />
      </>
    );
  }
  
  // عرض على شكل قائمة منسدلة
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <div className="text-sm font-medium">الإشعارات</div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="text-center p-4 text-sm text-muted-foreground">
            لا توجد إشعارات
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-4 py-2 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-2">
                  <NotificationIcon type={notification.type} />
                  <div>
                    <div className="text-sm font-medium">{notification.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      </span>
                      {!notification.read && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          جديد
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center py-2 cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              <div className="w-full text-sm text-blue-500">
                عرض كل الإشعارات
                <ChevronDown className="h-3 w-3 inline ml-1" />
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      
      <NotificationPopover 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        markAsRead={markAsRead}
        clearAllNotifications={clearAllNotifications}
      />
    </DropdownMenu>
  );
};

export default SmartNotificationSystem;