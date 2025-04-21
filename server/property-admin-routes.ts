import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertPropertySchema } from "@shared/schema";
import { UserRole } from "./constants/roles";

// وظيفة للتحقق من صلاحية الوصول لمالك العقار
export const isPropertyAdmin = (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return next();
    }
  }
  res.status(403).json({ message: 'غير مصرح بالوصول' });
};

// وظيفة التحقق من ملكية العقار
export const isPropertyOwner = async (req: Request, res: Response, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'غير مسجل الدخول' });
  }

  const propertyId = parseInt(req.params.id);
  const user = req.user as any;
  
  try {
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'العقار غير موجود' });
    }

    // التحقق من أن المستخدم هو مالك العقار أو مدير عام
    if (property.userId === user.id || user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    return res.status(403).json({ message: 'غير مصرح بالوصول لهذا العقار' });
  } catch (error) {
    console.error('خطأ في التحقق من ملكية العقار:', error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// تسجيل مسارات API لمالكي العقارات
export function registerPropertyAdminRoutes(app: Express) {
  // الحصول على عقارات المالك
  app.get('/api/property-admin/properties', isPropertyAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const properties = await storage.getUserProperties(userId);
      res.json(properties);
    } catch (error) {
      console.error('خطأ في جلب عقارات المالك:', error);
      res.status(500).json({ message: 'فشل في جلب العقارات' });
    }
  });

  // إضافة عقار جديد
  app.post('/api/property-admin/properties', isPropertyAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // التحقق من صحة بيانات العقار
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        userId: userId
      });

      const newProperty = await storage.createProperty(propertyData);
      res.status(201).json(newProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'بيانات العقار غير صالحة', errors: error.errors });
      }
      
      console.error('خطأ في إضافة عقار جديد:', error);
      res.status(500).json({ message: 'فشل في إضافة العقار الجديد' });
    }
  });

  // تحديث عقار موجود
  app.put('/api/property-admin/properties/:id', isPropertyOwner, async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // التحقق من صحة بيانات العقار
      const propertyData = insertPropertySchema.partial().parse(req.body);
      
      const updatedProperty = await storage.updateProperty(propertyId, propertyData);
      
      if (!updatedProperty) {
        return res.status(404).json({ message: 'العقار غير موجود' });
      }
      
      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'بيانات العقار غير صالحة', errors: error.errors });
      }
      
      console.error('خطأ في تحديث العقار:', error);
      res.status(500).json({ message: 'فشل في تحديث العقار' });
    }
  });

  // حذف عقار
  app.delete('/api/property-admin/properties/:id', isPropertyOwner, async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      const result = await storage.deleteProperty(propertyId);
      
      if (!result) {
        return res.status(404).json({ message: 'العقار غير موجود' });
      }
      
      res.status(200).json({ message: 'تم حذف العقار بنجاح' });
    } catch (error) {
      console.error('خطأ في حذف العقار:', error);
      res.status(500).json({ message: 'فشل في حذف العقار' });
    }
  });

  // الحصول على حجوزات عقار معين
  app.get('/api/property-admin/properties/:id/bookings', isPropertyOwner, async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      const bookings = await storage.getPropertyBookings(propertyId);
      
      res.json(bookings);
    } catch (error) {
      console.error('خطأ في جلب حجوزات العقار:', error);
      res.status(500).json({ message: 'فشل في جلب حجوزات العقار' });
    }
  });

  // الحصول على جميع حجوزات عقارات المالك
  app.get('/api/property-admin/bookings', isPropertyAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // الحصول على جميع عقارات المالك
      const properties = await storage.getUserProperties(userId);
      
      if (!properties.length) {
        return res.json([]);
      }
      
      // جمع حجوزات جميع العقارات
      const propertyIds = properties.map(property => property.id);
      const bookings = [];
      
      for (const propertyId of propertyIds) {
        const propertyBookings = await storage.getPropertyBookings(propertyId);
        bookings.push(...propertyBookings);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error('خطأ في جلب حجوزات المالك:', error);
      res.status(500).json({ message: 'فشل في جلب الحجوزات' });
    }
  });

  // تحديث حالة حجز
  app.patch('/api/property-admin/bookings/:id', isPropertyAdmin, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      // التحقق من صحة الحالة
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'حالة الحجز غير صالحة' });
      }
      
      // التحقق من أن الحجز موجود وينتمي لعقار المالك
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'الحجز غير موجود' });
      }
      
      const userId = (req.user as any).id;
      const property = await storage.getProperty(booking.propertyId);
      
      if (!property || (property.userId !== userId && (req.user as any).role !== UserRole.SUPER_ADMIN)) {
        return res.status(403).json({ message: 'غير مصرح بالوصول لهذا الحجز' });
      }
      
      // تحديث حالة الحجز
      const updatedBooking = await storage.updateBooking(bookingId, { status });
      
      res.json(updatedBooking);
    } catch (error) {
      console.error('خطأ في تحديث حالة الحجز:', error);
      res.status(500).json({ message: 'فشل في تحديث حالة الحجز' });
    }
  });

  // الحصول على بيانات إحصائية عن عقارات المالك
  app.get('/api/property-admin/analytics', isPropertyAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // الحصول على عقارات المالك
      const properties = await storage.getUserProperties(userId);
      
      if (!properties.length) {
        return res.json({
          totalProperties: 0,
          totalBookings: 0,
          occupancyRate: 0,
          totalRevenue: 0,
          averageRating: 0,
          propertiesWithBookings: []
        });
      }
      
      const propertyIds = properties.map(property => property.id);
      
      // إجمالي الحجوزات لجميع العقارات
      let totalBookings = 0;
      let totalRevenue = 0;
      let totalRating = 0;
      let ratingCount = 0;
      
      const propertiesWithBookings = [];
      
      for (const property of properties) {
        const bookings = await storage.getPropertyBookings(property.id);
        const propertyBookingsCount = bookings.length;
        const propertyRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
        
        totalBookings += propertyBookingsCount;
        totalRevenue += propertyRevenue;
        
        if (property.rating) {
          totalRating += property.rating;
          ratingCount++;
        }
        
        propertiesWithBookings.push({
          id: property.id,
          title: property.title,
          bookingsCount: propertyBookingsCount,
          revenue: propertyRevenue,
          rating: property.rating || 0
        });
      }
      
      // حساب معدل الإشغال ومتوسط التقييم
      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      
      // ملاحظة: حساب معدل الإشغال الحقيقي يتطلب مزيدًا من البيانات، هذا مجرد تقريب
      const occupancyRate = properties.length > 0 ? totalBookings / properties.length : 0;
      
      res.json({
        totalProperties: properties.length,
        totalBookings,
        occupancyRate,
        totalRevenue,
        averageRating,
        propertiesWithBookings
      });
    } catch (error) {
      console.error('خطأ في جلب البيانات الإحصائية:', error);
      res.status(500).json({ message: 'فشل في جلب البيانات الإحصائية' });
    }
  });

  // الحصول على تقييمات عقار معين
  app.get('/api/property-admin/properties/:id/reviews', isPropertyOwner, async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      const reviews = await storage.getPropertyReviews(propertyId);
      
      res.json(reviews);
    } catch (error) {
      console.error('خطأ في جلب تقييمات العقار:', error);
      res.status(500).json({ message: 'فشل في جلب تقييمات العقار' });
    }
  });
}