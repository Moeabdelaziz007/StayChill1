import { Request, Response, Application } from 'express';
import { storage } from './storage';
import { logger } from './logger';
import { UserRole } from '@shared/schema';
import { 
  matchPropertiesWithPreferences, 
  generateVirtualTourDescription,
  generateAreaGuide,
  analyzeCustomerReviews,
  segmentCustomers
} from './gemini';

/**
 * تسجيل مسارات API الخاصة بميزات الذكاء الاصطناعي
 */
export function registerAiRoutes(app: Application): void {
  
  /**
   * توصيات العقارات الذكية
   * يستخدم الذكاء الاصطناعي لتطابق تفضيلات المستخدم مع العقارات المتاحة
   */
  app.post("/api/recommendations", async (req: Request, res: Response) => {
    try {
      // الحصول على تفضيلات المستخدم من جسم الطلب
      const preferences = req.body;
      
      // الحصول على العقارات
      const properties = await storage.getProperties();
      
      // استخدام نموذج الذكاء الاصطناعي لتحليل التفضيلات ومطابقتها
      const recommendations = await matchPropertiesWithPreferences(properties, preferences);
      
      res.json(recommendations);
    } catch (error) {
      logger.error('ai-routes', 'Error in property recommendations', { error: String(error) });
      res.status(500).json({ 
        error: "حدث خطأ أثناء الحصول على التوصيات",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  /**
   * الجولة الافتراضية المحسّنة
   * يستخدم الذكاء الاصطناعي لإنشاء وصف دقيق وجذاب للعقار
   */
  app.get("/api/properties/:id/virtual-tour", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // الحصول على بيانات العقار
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: "العقار غير موجود" });
      }
      
      // استخدام نموذج الذكاء الاصطناعي لإنشاء وصف الجولة الافتراضية
      const tourData = await generateVirtualTourDescription(property);
      
      res.json(tourData);
    } catch (error) {
      logger.error('ai-routes', 'Error in virtual tour generation', { error: String(error) });
      res.status(500).json({ 
        error: "حدث خطأ أثناء إنشاء الجولة الافتراضية",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  /**
   * دليل المنطقة المخصص
   * يستخدم الذكاء الاصطناعي لإنشاء دليل مخصص للمنطقة المحيطة بالعقار
   */
  app.post("/api/properties/:id/area-guide", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // الحصول على تفضيلات المستخدم من جسم الطلب
      const preferences = req.body;
      
      // الحصول على بيانات العقار
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: "العقار غير موجود" });
      }
      
      // استخدام نموذج الذكاء الاصطناعي لإنشاء دليل المنطقة
      const areaGuideData = await generateAreaGuide(property, preferences);
      
      res.json(areaGuideData);
    } catch (error) {
      logger.error('ai-routes', 'Error in area guide generation', { error: String(error) });
      res.status(500).json({ 
        error: "حدث خطأ أثناء إنشاء دليل المنطقة",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  /**
   * تحليل التقييمات العام
   * يستخدم الذكاء الاصطناعي لتحليل جميع التقييمات في النظام
   * مفيد لملاك المنصة والمسؤولين
   */
  app.get("/api/analytics/review-analysis", async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤول رئيسي)
      if (!req.isAuthenticated() || req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ error: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      // الحصول على جميع التقييمات
      const reviews = await storage.getAllReviews();
      
      // استخدام نموذج الذكاء الاصطناعي لتحليل التقييمات
      const analysisData = await analyzeCustomerReviews(reviews);
      
      res.json(analysisData);
    } catch (error) {
      logger.error('ai-routes', 'Error in general review analysis', { error: String(error) });
      res.status(500).json({ 
        error: "حدث خطأ أثناء تحليل التقييمات",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  /**
   * تحليل تقييمات عقار محدد
   * يستخدم الذكاء الاصطناعي لتحليل تقييمات عقار محدد
   * مفيد لمالكي العقارات
   */
  app.get("/api/properties/:id/review-analysis", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // التحقق من صلاحيات المستخدم (يجب أن يكون مالك العقار أو مسؤول)
      if (req.isAuthenticated()) {
        const property = await storage.getProperty(propertyId);
        
        if (!property) {
          return res.status(404).json({ error: "العقار غير موجود" });
        }
        
        if (req.user?.role !== UserRole.SUPER_ADMIN && property.userId !== req.user?.id) {
          return res.status(403).json({ error: "غير مصرح لك بالوصول إلى هذه البيانات" });
        }
      } else {
        return res.status(401).json({ error: "يجب تسجيل الدخول للوصول إلى هذه البيانات" });
      }
      
      // الحصول على تقييمات العقار
      const reviews = await storage.getPropertyReviews(propertyId);
      
      // استخدام نموذج الذكاء الاصطناعي لتحليل التقييمات
      const analysisData = await analyzeCustomerReviews(reviews, propertyId);
      
      res.json(analysisData);
    } catch (error) {
      logger.error('ai-routes', 'Error in property review analysis', { error: String(error) });
      res.status(500).json({ 
        error: "حدث خطأ أثناء تحليل تقييمات العقار",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  /**
   * تقسيم العملاء إلى فئات
   * يستخدم الذكاء الاصطناعي لتقسيم العملاء إلى فئات بناءً على سلوكهم وتفضيلاتهم
   * مفيد للتسويق المستهدف
   */
  app.get("/api/analytics/customer-segmentation", async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤول رئيسي)
      if (!req.isAuthenticated() || req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ error: "غير مصرح لك بالوصول إلى هذه البيانات" });
      }
      
      // الحصول على بيانات المستخدمين
      const users = await storage.getAllUsers();
      
      // الحصول على بيانات الحجوزات والتقييمات لكل مستخدم
      const customerData = await Promise.all(users.map(async (user) => {
        const bookings = await storage.getUserBookings(user.id);
        const reviews = await storage.getUserReviews(user.id);
        const rewards = await storage.getUserRewards(user.id);
        
        // حساب متوسط التقييم
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : null;
        
        // حساب إجمالي الإنفاق
        const totalSpent = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        
        // حساب عدد الحجوزات المكتملة
        const completedBookings = bookings.filter(b => 
          b.status === 'completed' || 
          (b.status === 'confirmed' && new Date(b.checkoutDate) < new Date())
        ).length;
        
        // حساب معدل الحجز (عدد الحجوزات في السنة)
        const firstBookingDate = bookings.length > 0 
          ? bookings.reduce((earliest, booking) => 
              booking.createdAt < earliest ? booking.createdAt : earliest, 
              new Date()
            )
          : null;
          
        let bookingFrequency = 0;
        if (firstBookingDate && bookings.length > 1) {
          const daysSinceFirstBooking = (new Date().getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24);
          bookingFrequency = (bookings.length / daysSinceFirstBooking) * 365;
        }
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          totalBookings: bookings.length,
          completedBookings,
          totalSpent,
          avgRating,
          rewardPoints: user.rewardPoints,
          bookingFrequency: Math.round(bookingFrequency * 100) / 100,
          favoriteLocations: bookings
            .map(b => b.location)
            .reduce((acc: Record<string, number>, location) => {
              acc[location] = (acc[location] || 0) + 1;
              return acc;
            }, {}),
          averageStayDuration: bookings.length > 0 
            ? bookings.reduce((sum, b) => {
                const checkIn = new Date(b.checkinDate);
                const checkOut = new Date(b.checkoutDate);
                const days = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / bookings.length
            : 0
        };
      }));
      
      // استخدام نموذج الذكاء الاصطناعي لتقسيم العملاء
      const segmentationData = await segmentCustomers(customerData);
      
      res.json(segmentationData);
    } catch (error) {
      logger.error('ai-routes', 'Error in customer segmentation', { error: String(error) });
      res.status(500).json({ 
        error: "حدث خطأ أثناء تقسيم العملاء",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
}