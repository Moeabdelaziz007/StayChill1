import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import NodeCache from 'node-cache';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// إنشاء ذاكرة التخزين المؤقت للبيانات المتكررة
// تخزين مؤقت لمدة 5 دقائق للعناصر المميزة، 2 دقيقة للعناصر الأخرى
export const cache = new NodeCache({
  stdTTL: 120, // 2 دقائق افتراضيًا
  checkperiod: 60, // التحقق كل دقيقة
  useClones: false
});

// كائن للإعدادات المخصصة لكل نوع من البيانات
export const cacheSettings = {
  featuredProperties: 300, // 5 دقائق للعقارات المميزة
  featuredRestaurants: 300, // 5 دقائق للمطاعم المميزة
  properties: 120, // دقيقتان لقوائم العقارات
  propertiesByLocation: 180, // 3 دقائق للعقارات حسب الموقع
  restaurants: 120, // دقيقتان لقوائم المطاعم
  restaurantsByLocation: 180, // 3 دقائق للمطاعم حسب الموقع
  propertyDetails: 180, // 3 دقائق لتفاصيل العقار
  restaurantDetails: 180, // 3 دقائق لتفاصيل المطعم
  userBookings: 60, // دقيقة واحدة لحجوزات المستخدم
  propertyReviews: 300, // 5 دقائق لتقييمات العقار
  restaurantReviews: 300, // 5 دقائق لتقييمات المطعم
  userRewards: 60, // دقيقة واحدة لنقاط المكافآت
  userRewardsStatus: 60 // دقيقة واحدة لحالة نقاط المكافآت
};

// تهيئة حجم التجمع لتحسين الأداء
const poolConfig = { 
  connectionString: process.env.DATABASE_URL,
  max: 20, // الحد الأقصى للاتصالات
  idleTimeoutMillis: 30000, // إغلاق الاتصالات غير المستخدمة بعد 30 ثانية
  connectionTimeoutMillis: 2000 // زمن انتهاء مهلة الاتصال
};

// Create connection pool with optimized settings
export const pool = new Pool(poolConfig);

// Create drizzle database instance with our schema
export const db = drizzle(pool, { schema });