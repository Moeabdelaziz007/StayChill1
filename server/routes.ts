import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
// import { firestoreStorage } from "./firestore-storage";
import { z } from "zod";
import { verifyFirebaseToken, requireFirebaseAuth, PermissionAction, ResourceType, AuditLogEntry, logAuditEvent as firebaseLogAuditEvent } from "./firebase-admin";
import { UserRole } from "./constants/roles";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { registerRewardsRoutes } from "./rewards-routes";
import { registerPropertyAdminRoutes } from "./property-admin-routes";
import { registerAiRoutes } from "./ai-routes";
import { registerSeoRoutes } from "./seo-routes";
import { securityMiddleware, checkPermission } from "./security-middleware";
import { authenticateUser, authorizeRoles, authorizeOwnerOrAdmin } from "./middleware/authorize";
import { logger } from "./logger";
import { isImageRequest, optimizedImageMiddleware } from "./image-service";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { cache, cacheSettings } from "./db";
import { 
  User, 
  Booking, 
  Property, 
  insertUserSchema,
  insertPropertySchema, 
  insertBookingSchema, 
  insertReviewSchema,
  insertRewardTransactionSchema,
  insertRestaurantSchema,
  insertRestaurantReservationSchema,
  insertRestaurantReviewSchema,
  insertTripPlanSchema,
  insertTripItemSchema,
  insertTripCommentSchema,
  insertChatConversationSchema,
  insertChatMessageSchema,
  insertChatParticipantSchema,
  ChatType,
  TRIP_ITEM_TYPES
} from "@shared/schema";

// تهيئة Gemini AI
if (!process.env.GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY environment variable. AI features will not work properly.');
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

const geminiModelForRoutes = genAI 
  ? genAI.getGenerativeModel({ model: "gemini-pro" }) 
  : null;

// We'll use in-memory storage for now while we troubleshoot Firestore
// const storage = firestoreStorage;

// Set up Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable. Payment features will not work properly.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
}) : undefined;

// Gemini AI - would need Google AI SDK configured
// Import the Gemini AI functions
import { 
  matchPropertiesWithPreferences, 
  generateVirtualTourDescription,
  generateAreaGuide,
  analyzeCustomerReviews,
  segmentCustomers
} from './gemini';

interface PropertyOwner extends User {
  username: string;
  email: string;
}

async function notifyPropertyOwner(
  owner: PropertyOwner, 
  booking: Booking, 
  property: Property
): Promise<void> {
  try {
    // هنا يمكن تنفيذ منطق الإشعارات
    // مثل إرسال بريد إلكتروني أو إشعار عبر WebSocket
    
    console.log(`إشعار لمالك العقار: ${owner.username} - حجز جديد #${booking.id} للعقار ${property.title}`);
    
    // إذا كان المالك متصلًا بالويب سوكت، يمكن إرسال إشعار له
    // سيتم تنفيذ هذا في وظيفة sendNotification بعد إعداد WebSocket
  } catch (error) {
    console.error('Error notifying property owner:', error);
    logger.error('notification', 'Failed to notify property owner', { 
      ownerId: owner.id, 
      bookingId: booking.id, 
      propertyId: property.id,
      error: String(error)
    });
  }
}



// نموذج مسار API للترجمة
const translateTextSchema = z.object({
  text: z.string(),
  sourceLang: z.string(),
  targetLang: z.string()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // تعريف متغير logAuditEvent على مستوى المسارات
  const logAuditEvent = (req: Request, entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent'>) => {
    // استخدام الدالة المستوردة من firebase-admin
    firebaseLogAuditEvent(req, entry);
  };
  
  // إضافة middleware لمعالجة الصور
  // 1. التحقق ما إذا كان الطلب متعلق بصورة
  app.use(isImageRequest);
  // 2. معالجة وتحسين الصور (WebP/AVIF)
  app.use(optimizedImageMiddleware);
  
  // تسجيل مسارات API لنظام المكافآت
  registerRewardsRoutes(app);
  
  // تسجيل مسارات API لمالكي العقارات
  registerPropertyAdminRoutes(app);
  
  // تسجيل مسارات API لميزات الذكاء الاصطناعي
  registerAiRoutes(app);
  
  // تسجيل مسارات API لتحليل وأداء SEO
  registerSeoRoutes(app);
  
  // CSRF token functionality removed temporarily
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    // Respond with success but don't generate real tokens
    res.json({ success: true });
  });
  
  // مسارات المطاعم
  // جلب جميع المطاعم
  app.get("/api/restaurants", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // التحقق من التخزين المؤقت أولاً
      const cacheKey = `restaurants_${limit}_${offset}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        logger.info('cache', `Using cached restaurants data for ${cacheKey}`);
        return res.json(cachedData);
      }
      
      // استرجاع البيانات من قاعدة البيانات إذا لم تكن مخزنة مؤقتًا
      const restaurants = await storage.getRestaurants(limit, offset);
      
      // تخزين النتائج مؤقتًا
      cache.set(cacheKey, restaurants, cacheSettings.restaurants);
      
      res.json(restaurants);
    } catch (error) {
      logger.error('routes', 'Error fetching restaurants', { error: String(error) });
      res.status(500).json({ error: "Error fetching restaurants" });
    }
  });

  // جلب المطاعم المميزة
  app.get("/api/restaurants/featured", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      
      // التحقق من التخزين المؤقت أولاً
      const cacheKey = `featured_restaurants_${limit}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        logger.info('cache', `Using cached featured restaurants data for ${limit} items`);
        return res.json(cachedData);
      }
      
      // استرجاع البيانات من قاعدة البيانات إذا لم تكن مخزنة مؤقتًا
      const restaurants = await storage.getFeaturedRestaurants(limit);
      
      // تخزين النتائج مؤقتًا لمدة أطول (5 دقائق) لأن العناصر المميزة لا تتغير بشكل متكرر
      cache.set(cacheKey, restaurants, cacheSettings.featuredRestaurants);
      
      res.json(restaurants);
    } catch (error) {
      logger.error('routes', 'Error fetching featured restaurants', { error: String(error) });
      res.status(500).json({ error: "Error fetching featured restaurants" });
    }
  });

  // جلب المطاعم حسب الموقع
  app.get("/api/restaurants/location/:location", async (req: Request, res: Response) => {
    try {
      const location = req.params.location;
      
      // التحقق من التخزين المؤقت أولاً
      const cacheKey = `restaurants_location_${location}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        logger.info('cache', `Using cached restaurants data for location ${location}`);
        return res.json(cachedData);
      }
      
      // استرجاع البيانات من قاعدة البيانات إذا لم تكن مخزنة مؤقتًا
      const restaurants = await storage.getRestaurantsByLocation(location);
      
      // تخزين النتائج مؤقتًا
      cache.set(cacheKey, restaurants, cacheSettings.restaurantsByLocation);
      
      res.json(restaurants);
    } catch (error) {
      logger.error('routes', 'Error fetching restaurants by location', { error: String(error) });
      res.status(500).json({ error: "Error fetching restaurants by location" });
    }
  });

  // جلب مطعم محدد بواسطة المعرف
  app.get("/api/restaurants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `restaurant_${id}`;
      const cachedRestaurant = cache.get(cacheKey);
      
      if (cachedRestaurant) {
        logger.info('cache', `Using cached restaurant data for ID ${id}`);
        return res.json(cachedRestaurant);
      }
      
      // استعلام البيانات من قاعدة البيانات إذا لم تكن مخزنة مؤقتًا
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // تخزين البيانات مؤقتًا لمدة 3 دقائق
      cache.set(cacheKey, restaurant, cacheSettings.restaurantDetails);
      
      res.json(restaurant);
    } catch (error) {
      logger.error('routes', 'Error fetching restaurant', { error: String(error), restaurantId: req.params.id });
      res.status(500).json({ error: "Error fetching restaurant" });
    }
  });

  // إنشاء حجز مطعم
  app.post("/api/restaurant-reservations", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // التحقق من صحة بيانات الطلب
      const validationResult = insertRestaurantReservationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      const reservationData = validationResult.data;
      
      // التحقق من وجود المطعم
      const restaurant = await storage.getRestaurant(reservationData.restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(reservationData.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // إنشاء الحجز
      const reservation = await storage.createRestaurantReservation(reservationData);
      
      // سجل حدث التدقيق
      logAuditEvent(req, {
        action: "create_restaurant_reservation",
        userId: user.id,
        userRole: user.role,
        resource: ResourceType.RESTAURANT,
        resourceId: restaurant.id,
        success: true,
        details: { reservationId: reservation.id }
      });
      
      res.status(201).json(reservation);
    } catch (error) {
      logger.error('routes', 'Error creating restaurant reservation', { error: String(error) });
      res.status(500).json({ error: "Error creating restaurant reservation" });
    }
  });

  // جلب حجوزات المستخدم
  app.get("/api/restaurant-reservations/user", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let userId: number;
      
      if (req.user) {
        userId = req.user.id;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const reservations = await storage.getUserRestaurantReservations(userId);
      
      // إضافة معلومات المطعم لكل حجز
      const reservationsWithRestaurantInfo = await Promise.all(
        reservations.map(async (reservation) => {
          const restaurant = await storage.getRestaurant(reservation.restaurantId);
          return {
            ...reservation,
            restaurant: restaurant || null
          };
        })
      );
      
      res.json(reservationsWithRestaurantInfo);
    } catch (error) {
      logger.error('routes', 'Error fetching user restaurant reservations', { error: String(error) });
      res.status(500).json({ error: "Error fetching user restaurant reservations" });
    }
  });

  // إلغاء حجز مطعم
  app.post("/api/restaurant-reservations/:id/cancel", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const reservationId = parseInt(req.params.id);
      
      // التحقق من وجود الحجز
      const reservation = await storage.getRestaurantReservation(reservationId);
      
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      
      // التحقق من أن المستخدم هو صاحب الحجز أو مسؤول
      let userId: number;
      let userRole: string = UserRole.CUSTOMER;
      
      if (req.user) {
        userId = req.user.id;
        userRole = req.user.role;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
        userRole = user.role;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const isAdmin = userRole === UserRole.SUPER_ADMIN;
      const isOwner = reservation.userId === userId;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: "Not authorized to cancel this reservation" });
      }
      
      // إلغاء الحجز
      const success = await storage.cancelRestaurantReservation(reservationId);
      
      if (!success) {
        return res.status(500).json({ error: "Error cancelling reservation" });
      }
      
      // سجل حدث التدقيق
      logAuditEvent(req, {
        action: "cancel_restaurant_reservation",
        userId,
        userRole,
        resource: ResourceType.RESTAURANT,
        resourceId: reservation.restaurantId,
        success: true,
        details: { reservationId }
      });
      
      res.json({ success: true, message: "Reservation cancelled successfully" });
    } catch (error) {
      logger.error('routes', 'Error cancelling restaurant reservation', { error: String(error) });
      res.status(500).json({ error: "Error cancelling restaurant reservation" });
    }
  });

  // إضافة تقييم للمطعم
  app.post("/api/restaurant-reviews", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // التحقق من صحة بيانات الطلب
      const validationResult = insertRestaurantReviewSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      const reviewData = validationResult.data;
      
      // التحقق من وجود المطعم
      const restaurant = await storage.getRestaurant(reviewData.restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(reviewData.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // التحقق من أن المستخدم له حق تقييم المطعم (حجز سابق)
      const userReservations = await storage.getUserRestaurantReservations(user.id);
      const hasReservation = userReservations.some(r => 
        r.restaurantId === reviewData.restaurantId && 
        (r.status === 'confirmed' || r.status === 'completed')
      );
      
      if (!hasReservation && user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ 
          error: "You need to have a confirmed reservation at this restaurant before you can review it" 
        });
      }
      
      // إنشاء التقييم
      const review = await storage.createRestaurantReview(reviewData);
      
      // سجل حدث التدقيق
      logAuditEvent(req, {
        action: "create_restaurant_review",
        userId: user.id,
        userRole: user.role,
        resource: ResourceType.RESTAURANT,
        resourceId: restaurant.id,
        success: true,
        details: { reviewId: review.id, rating: review.rating }
      });
      
      res.status(201).json(review);
    } catch (error) {
      logger.error('routes', 'Error creating restaurant review', { error: String(error) });
      res.status(500).json({ error: "Error creating restaurant review" });
    }
  });

  // جلب تقييمات مطعم
  app.get("/api/restaurants/:id/reviews", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `restaurant_reviews_${restaurantId}`;
      const cachedReviews = cache.get(cacheKey);
      
      if (cachedReviews) {
        logger.info('cache', `Using cached restaurant reviews for restaurant ID ${restaurantId}`);
        return res.json(cachedReviews);
      }
      
      // التحقق من وجود المطعم
      const restaurant = await storage.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // جلب التقييمات
      const reviews = await storage.getRestaurantReviews(restaurantId);
      
      // إضافة معلومات المستخدم لكل تقييم
      const reviewsWithUserInfo = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            username: user ? user.username : "Unknown User",
            userAvatar: user ? user.avatar : null
          };
        })
      );
      
      // تخزين النتيجة مؤقتًا (لمدة 5 دقائق)
      cache.set(cacheKey, reviewsWithUserInfo, cacheSettings.restaurantReviews);
      
      res.json(reviewsWithUserInfo);
    } catch (error) {
      logger.error('routes', 'Error fetching restaurant reviews', { error: String(error) });
      res.status(500).json({ error: "Error fetching restaurant reviews" });
    }
  });
  
  // مسار API للترجمة
  app.post('/api/translate', async (req, res) => {
    try {
      // التحقق من البيانات المدخلة
      const { text, sourceLang, targetLang } = translateTextSchema.parse(req.body);
      
      if (!text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      // استدعاء نموذج Gemini للترجمة من ملف gemini-translation.ts
      const translationModel = await import('./gemini-translation').then(m => m.geminiTranslationModel);
      
      if (!translationModel) {
        return res.status(500).json({ error: 'Translation service is not available' });
      }
      
      const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text without any additional notes or explanations:
      
      "${text}"`;
      
      try {
        const result = await translationModel.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();
        
        res.json({ translatedText });
      } catch (genError) {
        console.error('Gemini translation error:', genError);
        res.status(500).json({ error: 'Translation service error' });
      }
    } catch (error) {
      console.error('Translation API error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to translate text' });
    }
  });
  // Set up session management
  const SessionStore = MemoryStore(session);

  app.use(session({
    secret: process.env.SESSION_SECRET || 'staychill-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Set up Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // الآن بعد إعداد الجلسة والمصادقة، يمكننا إضافة middleware الأمان
  app.use(verifyFirebaseToken);
  
  // تطبيق middleware الأمان الأساسي على جميع المسارات
  app.use(securityMiddleware);

  // Configure passport local strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        console.log(`Attempting login for email: ${email}`);
        const user = await storage.getUserByEmail(email);

        if (!user) {
          console.log(`No user found with email: ${email}`);
          return done(null, false, { message: 'Incorrect email or password' });
        }

        console.log(`User found: ${user.username}, role: ${user.role}, Checking password...`);
        console.log(`Password hash format: ${user.password.substring(0, 10)}...`);

        // Check for various password formats and try multiple methods
        let isPasswordValid = false;

        // Check 1: Standard bcrypt hash
        if (user.password.startsWith('$2')) {
          console.log(`Using bcrypt comparison for user: ${user.username}`);
          try {
            isPasswordValid = await bcrypt.compare(password, user.password);
            console.log(`Bcrypt compare result: ${isPasswordValid}`);
          } catch (err) {
            console.error('Bcrypt compare error:', err);
            isPasswordValid = false;
          }
        } 

        // Check 2: Direct comparison (for test accounts or unhashed passwords)
        if (!isPasswordValid) {
          console.log(`Trying direct comparison for user: ${user.username}`);
          if (user.password === password) {
            console.log('Direct comparison successful');
            isPasswordValid = true;

            // Auto-upgrade to bcrypt hash for better security in future logins
            try {
              const hashedPassword = await bcrypt.hash(password, 10);
              await storage.updateUser(user.id, { password: hashedPassword });
              console.log('Password auto-upgraded to bcrypt hash');
            } catch (upgradeErr) {
              console.error('Error upgrading password:', upgradeErr);
              // Still allow login even if upgrade fails
            }
          }
        }

        // Check 3: Emergency access for test/admin accounts (only if email matches)
        if (!isPasswordValid && (
            (email === 'admin@staychill.com' && password === 'admin123') || 
            (email === 'property@staychill.com' && password === 'property123') ||
            (email === 'amrikyy@gmail.com' && password === 'amrikyy123')
        )) {
          console.log('Emergency access granted for test/admin account');
          isPasswordValid = true;

          // Regenerate password hash
          try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await storage.updateUser(user.id, { password: hashedPassword });
            console.log('Password regenerated with proper bcrypt hash');
          } catch (upgradeErr) {
            console.error('Error regenerating password:', upgradeErr);
            // Still allow login even if upgrade fails
          }
        }

        console.log(`Password valid: ${isPasswordValid}`);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        console.log(`Login successful for user: ${user.username}`);
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
  };

  const isPropertyAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      // Check for property admin or super admin role
      if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.SUPER_ADMIN) {
        return next();
      }
    }
    res.status(403).json({ message: 'Not authorized' });
  };

  const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      if (user.role === UserRole.SUPER_ADMIN) {
        return next();
      }
    }
    res.status(403).json({ message: 'Not authorized' });
  };

  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Hash the password with bcrypt
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // If the email is Amrikyy@gmail.com, assign the super_admin role
      let role = UserRole.CUSTOMER;
      if (userData.email.toLowerCase() === 'amrikyy@gmail.com') {
        role = UserRole.SUPER_ADMIN;
      }

      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: role
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

  app.post('/api/login', (req, res, next) => {
    // Normalize email to lowercase to prevent case sensitivity issues
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
    console.log('Login request received:', req.body);
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed:', info?.message || 'Unknown reason');
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session login error:', loginErr);
          return next(loginErr);
        }

        console.log('Login successful, user:', user.username);
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Direct admin access endpoint for emergency use
  app.post('/api/admin-login', async (req, res) => {
    try {
      let { email, password } = req.body;
      // Normalize email to lowercase to prevent case sensitivity issues
      if (email) {
        email = email.toLowerCase();
      }
      console.log(`Admin login attempt for: ${email}`);

      // Only allow specific admin accounts through this route
      const adminCredentials = {
        'admin@staychill.com': {
          password: 'admin123',
          role: UserRole.SUPER_ADMIN
        },
        'property@staychill.com': {
          password: 'property123',
          role: UserRole.PROPERTY_ADMIN
        },
        'amrikyy@gmail.com': {
          password: 'amrikyy123',
          role: UserRole.SUPER_ADMIN
        },
        'amrikyy1@gmail.com': {
          password: 'test123', // Using a simple password for testing
          role: UserRole.SUPER_ADMIN
        }
      };

      // Check if credentials match any admin account
      // Convert the admin email keys to lowercase for case-insensitive comparison
      const normalizedAdminCredentials = Object.entries(adminCredentials).reduce((acc, [key, val]) => {
        acc[key.toLowerCase()] = val;
        return acc;
      }, {} as Record<string, {password: string, role: string}>);

      console.log('Checking admin credentials:');
      console.log('Email:', email);
      console.log('Admin credentials available:', Object.keys(normalizedAdminCredentials));
      console.log('Is email in admin credentials:', !!normalizedAdminCredentials[email]);

      if (normalizedAdminCredentials[email]) {
        console.log('Expected password:', normalizedAdminCredentials[email].password);
        console.log('Password match:', normalizedAdminCredentials[email].password === password);
      }

      if (!normalizedAdminCredentials[email] || normalizedAdminCredentials[email].password !== password) {
        console.log('Admin login failed: Invalid credentials');
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      // Get or create the admin user
      let adminUser = await storage.getUserByEmail(email);

      if (!adminUser) {
        // Create the admin user if it doesn't exist
        console.log(`Admin user ${email} not found, creating user`);
        const hashedPassword = await bcrypt.hash(password, 10);

        adminUser = await storage.createUser({
          username: email.split('@')[0],
          email,
          password: hashedPassword,
          firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          lastName: 'Admin',
          role: normalizedAdminCredentials[email].role,
          rewardPoints: 0,
          createdAt: new Date()
        });

        console.log(`Created admin user: ${adminUser.username} with role ${adminUser.role}`);
      } else {
        // Update the admin user password and role if needed
        if (adminUser.role !== normalizedAdminCredentials[email].role) {
          adminUser = await storage.updateUser(adminUser.id, { 
            role: normalizedAdminCredentials[email].role 
          });
          console.log(`Updated admin user role to ${normalizedAdminCredentials[email].role}`);
        }

        // Ensure password is properly hashed
        if (!adminUser.password.startsWith('$2')) {
          const hashedPassword = await bcrypt.hash(password, 10);
          adminUser = await storage.updateUser(adminUser.id, { 
            password: hashedPassword 
          });
          console.log('Updated admin password with proper hash');
        }
      }

      // Login the admin user
      req.login(adminUser, (loginErr) => {
        if (loginErr) {
          console.error('Admin session login error:', loginErr);
          return res.status(500).json({ message: 'Login session creation failed' });
        }

        console.log(`Admin login successful for ${adminUser.email} with role ${adminUser.role}`);
        const { password, ...userWithoutPassword } = adminUser;
        return res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'An error occurred during admin login' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Emergency login endpoint has been removed as requested

  // Simple in-memory cache for session data
  const sessionCache = new Map();
  const SESSION_CACHE_TTL = 60 * 1000; // 1 minute

  app.get('/api/me', (req, res) => {
    const sessionId = req.sessionID;
    const cachedUser = sessionCache.get(sessionId);

    // استخدام البيانات المخزنة مؤقتًا إذا كانت متوفرة وحديثة
    if (cachedUser && Date.now() - cachedUser.timestamp < SESSION_CACHE_TTL) {
      // لا نسجل طلب الكاش لتجنب إثقال سجل التدقيق
      return res.json(cachedUser.data);
    }

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // تسجيل نجاح الوصول لمعلومات المستخدم في سجل التدقيق
    // نسجل فقط عند تحديث الكاش لتجنب كثرة السجلات
    const currentUser = req.user as User;
    
    logAuditEvent(req, {
      action: 'access_user_info',
      userId: currentUser.id,
      userRole: currentUser.role,
      resource: ResourceType.USER,
      success: true,
      details: { endpoint: '/api/me' }
    });

    const { password, ...user } = currentUser;
    sessionCache.set(sessionId, {
      data: user,
      timestamp: Date.now()
    });

    res.json(user);
  });

  // Firebase authentication endpoint
  app.post('/api/firebase-auth', async (req, res) => {
    try {
      const { firebaseUid, email, firstName, lastName, photoURL } = req.body;

      if (!firebaseUid || !email) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if user already exists by email
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create a new user if doesn't exist
        console.log(`Creating new user from Firebase auth: ${email}`);

        // Generate a random secure password they won't need (using Firebase auth)
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Create username from email
        const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);

        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          role: email.toLowerCase() === 'amrikyy@gmail.com' ? UserRole.SUPER_ADMIN : UserRole.CUSTOMER,
          rewardPoints: 0,
          avatar: photoURL || null,
          firebaseUid
        });

        console.log(`Created new user: ${user.username} (${user.id}) with role ${user.role}`);
      } else {
        // Update existing user with Firebase info if needed
        if (!user.firebaseUid || user.firebaseUid !== firebaseUid) {
          console.log(`Updating existing user ${user.id} with Firebase UID`);
          user = await storage.updateUser(user.id, { 
            firebaseUid,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            avatar: photoURL || user.avatar
          });
        }
      }

      // Log in the user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Firebase auth session login error:', loginErr);
          return res.status(500).json({ message: 'Login session creation failed' });
        }

        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Firebase authentication error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  });

  // Get properties owned by the current user
  app.get('/api/me/properties', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;

      if (user.role !== UserRole.PROPERTY_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'Not authorized to access properties' });
      }

      const properties = await storage.getUserProperties(user.id);
      res.json(properties);
    } catch (error) {
      logger.error('user_properties', 'Error fetching user properties', { error: String(error) });
      res.status(500).json({ message: 'Failed to fetch user properties' });
    }
  });

  // Property routes
  app.get('/api/properties', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const location = req.query.location as string | undefined;

      // إنشاء مفتاح التخزين المؤقت مع المعلمات
      const cacheKey = location 
        ? `properties_loc_${location}` 
        : `properties_${limit}_${offset}`;
      
      // التحقق إذا كانت البيانات مخزنة مؤقتاً
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        logger.info('cache', `Using cached properties data for ${cacheKey}`);
        return res.json(cachedData);
      }

      // إذا لم تكن البيانات مخزنة مؤقتاً، استعلم من قاعدة البيانات
      let properties;
      if (location) {
        properties = await storage.getPropertiesByLocation(location);
        
        // تخزين النتائج مؤقتًا (لمدة 2 دقيقة للبيانات المستندة إلى الموقع)
        cache.set(cacheKey, properties, cacheSettings.properties);
      } else {
        properties = await storage.getProperties(limit, offset);
        
        // تخزين النتائج مؤقتًا (لمدة دقيقتين)
        cache.set(cacheKey, properties, cacheSettings.properties);
      }

      res.json(properties);
    } catch (error) {
      logger.error('properties', 'Failed to fetch properties', { error: String(error) });
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  });

  app.get('/api/properties/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      
      // التحقق من وجود بيانات في التخزين المؤقت أولاً
      const cacheKey = `featured_properties_${limit}`;
      const cachedProperties = cache.get(cacheKey);
      
      if (cachedProperties) {
        logger.info('cache', `Using cached featured properties data for ${limit} items`);
        return res.json(cachedProperties);
      }
      
      // استعلام البيانات من قاعدة البيانات إذا لم تكن مخزنة مؤقتًا
      const properties = await storage.getFeaturedProperties(limit);
      
      // تخزين النتائج مؤقتًا لمدة أطول (5 دقائق) لأن العقارات المميزة لا تتغير بشكل متكرر
      cache.set(cacheKey, properties, cacheSettings.featuredProperties);
      
      res.json(properties);
    } catch (error) {
      logger.error('properties', 'Failed to fetch featured properties', { error: String(error) });
      res.status(500).json({ message: 'Failed to fetch featured properties' });
    }
  });

  // واجهة برمجة التطبيقات للتوصيات الشخصية
  app.get('/api/recommendations/personalized', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      // جمع سلوكيات المستخدم من قواعد البيانات
      const userBookings = await storage.getUserBookings(user.id);
      const userSearches: any[] = []; // يجب تنفيذ تخزين عمليات البحث في المستقبل
      
      // جمع العقارات المتاحة
      const allProperties = await storage.getProperties(20, 0);
      
      // إذا كانت واجهة برمجة Gemini متاحة، استخدمها للتوصيات
      let personalizedResults: Property[] = [];
      let matchReasons: Record<number, string[]> = {};
      
      try {
        if (process.env.GEMINI_API_KEY) {
          // تحويل البيانات إلى الصيغة المطلوبة للوظيفة
          const userPreferences = {
            location: userBookings.length > 0 ? 
              allProperties.find(p => p.id === userBookings[0].propertyId)?.location : undefined,
            priceRange: userBookings.length > 0 ? 
              { 
                min: Math.min(...userBookings.map(b => b.totalPrice / (
                  (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)
                ))),
                max: Math.max(...userBookings.map(b => b.totalPrice / (
                  (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)
                )))
              } : undefined,
            amenities: []
          };
          
          const aiResults = await matchPropertiesWithPreferences(
            allProperties,
            userPreferences
          );
          
          personalizedResults = aiResults
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit)
            .map(result => result.property);
          
          // تخزين أسباب المطابقة
          aiResults.forEach(result => {
            matchReasons[result.property.id] = result.reasonsToBook;
          });
        }
      } catch (aiError) {
        logger.error('gemini', 'Error using AI for recommendations', { error: String(aiError) });
        // استمرار باستخدام الطريقة البسيطة في حالة فشل الذكاء الاصطناعي
      }
      
      // إذا لم تعمل توصيات الذكاء الاصطناعي، استخدم منطق بسيط
      if (personalizedResults.length === 0) {
        // 1. المواقع المفضلة
        const favoriteLocations = new Map<string, number>();
        
        userBookings.forEach(booking => {
          const property = allProperties.find(p => p.id === booking.propertyId);
          if (property) {
            favoriteLocations.set(
              property.location, 
              (favoriteLocations.get(property.location) || 0) + 1
            );
          }
        });
        
        // إذا كان لدى المستخدم حجوزات سابقة، اقترح عقارات في نفس المواقع
        if (favoriteLocations.size > 0) {
          const sortedLocations = [...favoriteLocations.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
          
          // أضف عقارات من المواقع المفضلة
          for (const location of sortedLocations) {
            const propertiesInLocation = allProperties
              .filter(p => p.location === location && !userBookings.some(b => b.propertyId === p.id));
            
            personalizedResults = [...personalizedResults, ...propertiesInLocation];
            
            if (personalizedResults.length >= limit) {
              personalizedResults = personalizedResults.slice(0, limit);
              break;
            }
          }
          
          // إضافة أسباب التوصية
          personalizedResults.forEach(property => {
            const location = property.location;
            const timesBooked = favoriteLocations.get(location) || 0;
            
            matchReasons[property.id] = [
              `زرت ${location} من قبل ${timesBooked} مرة`,
              `يتناسب هذا العقار مع أسلوب إقامتك السابق`
            ];
          });
        }
      }
      
      // استكمال النتائج بالعقارات المميزة إذا لم يكن لدينا ما يكفي
      if (personalizedResults.length < limit) {
        const featured = await storage.getFeaturedProperties(limit - personalizedResults.length);
        
        // تخزين الأسباب للعقارات المميزة
        featured.forEach(property => {
          if (!matchReasons[property.id]) {
            matchReasons[property.id] = [
              'عقار مميز لدينا',
              'من أكثر العقارات حجزاً في الموقع'
            ];
          }
        });
        
        // استبعاد العقارات المكررة
        const existingIds = personalizedResults.map(p => p.id);
        const filteredFeatured = featured.filter(p => !existingIds.includes(p.id));
        
        personalizedResults = [...personalizedResults, ...filteredFeatured].slice(0, limit);
      }
      
      // إرجاع النتائج مع أسباب التوصية
      res.json({
        properties: personalizedResults,
        reasons: matchReasons
      });
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      res.status(500).json({ message: 'Failed to get personalized recommendations' });
    }
  });
  
  // ====== واجهات برمجة التطبيقات لنظام الإشعارات ======
  
  // الحصول على إشعارات المستخدم
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // في حالة وجود منطق لتخزين الإشعارات في المستقبل
      // await storage.getUserNotifications(user.id);
      
      // لأغراض العرض التوضيحي، سنقدم إشعارات مستندة إلى البيانات الحالية للمستخدم
      const userBookings = await storage.getUserBookings(user.id);
      const now = new Date();
      const upcomingBookings = userBookings.filter(booking => {
        const startDate = new Date(booking.startDate);
        const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7; // حجوزات في الأسبوع القادم
      });
      
      // بناء الإشعارات الديناميكية
      const notifications = [];
      
      // 1. إشعارات تذكير بالحجز
      for (const booking of upcomingBookings) {
        const property = await storage.getProperty(booking.propertyId);
        if (property) {
          const startDate = new Date(booking.startDate);
          const daysUntilBooking = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          notifications.push({
            id: `booking-reminder-${booking.id}`,
            type: 'booking_reminder',
            title: `تذكير بحجزك القادم في ${daysUntilBooking} أيام`,
            message: `حجزك في ${property.title} يبدأ في ${startDate.toLocaleDateString('ar-EG')}. استمتع بإقامتك!`,
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            actionUrl: `/bookings/${booking.id}`,
            actionText: 'عرض تفاصيل الحجز',
            priority: 'high',
            metadata: {
              bookingId: booking.id
            }
          });
        }
      }
      
      // 2. إشعار عرض ترويجي (افتراضي)
      notifications.push({
        id: 'offer-weekend-2025',
        type: 'offer',
        title: 'عرض خاص لك',
        message: 'احصل على خصم 15% على حجوزات عطلة نهاية الأسبوع في رأس الحكمة',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/offers/summer-weekend',
        actionText: 'استفد من العرض',
        priority: 'medium',
        metadata: {
          offerCode: 'WEEKEND15',
          locationName: 'رأس الحكمة',
          discount: '15%'
        }
      });
      
      // 3. إشعار لمستخدم لديه نقاط كافية
      if (user.rewardPoints >= 500) {
        notifications.push({
          id: 'rewards-redeem-reminder',
          type: 'reward',
          title: 'استبدل نقاطك!',
          message: `لديك ${user.rewardPoints} نقطة ChillPoints. يمكنك استبدالها الآن للحصول على خصم على حجزك القادم!`,
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/rewards/redeem',
          actionText: 'استبدل النقاط',
          priority: 'medium',
          metadata: {
            pointsAmount: user.rewardPoints
          }
        });
      }
      
      // 4. عرض فلاش (ينتهي قريبًا)
      notifications.push({
        id: 'flash-sale-marina-2025',
        type: 'flash_sale',
        title: 'عرض فلاش! فرصة محدودة',
        message: 'خصم 25% على إقامة لمدة 3 ليالٍ في منتجع النخيل الفاخر في مارينا. العرض محدود بـ 24 ساعة فقط!',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/properties/flash-deal',
        actionText: 'احجز الآن',
        expiresAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        metadata: {
          limitedTime: true,
          discount: '25%',
          locationName: 'مارينا'
        }
      });
      
      // 5. إذا كان لديه حجز قريب، أرسل نصائح للرحلة
      if (upcomingBookings.length > 0) {
        const closestBooking = upcomingBookings.sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )[0];
        
        const property = await storage.getProperty(closestBooking.propertyId);
        
        if (property) {
          notifications.push({
            id: `trip-tip-${closestBooking.id}`,
            type: 'trip_tip',
            title: 'نصائح لرحلتك القادمة',
            message: `الطقس في ${property.location} سيكون مشمسًا خلال إقامتك. لا تنس احضار كريم الحماية من الشمس ونظارات شمسية!`,
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            read: true,
            priority: 'low'
          });
        }
      }
      
      // إرجاع الإشعارات مرتبة حسب الأحدث
      res.json(notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // تحديد إشعار كمقروء
  app.post('/api/notifications/:id/read', isAuthenticated, (req, res) => {
    try {
      const notificationId = req.params.id;
      
      // في حالة وجود منطق لتخزين حالة الإشعارات في المستقبل
      // await storage.markNotificationAsRead(notificationId);
      
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });
  
  // تحديد جميع الإشعارات كمقروءة
  app.post('/api/notifications/mark-all-read', isAuthenticated, (req, res) => {
    try {
      const user = req.user as any;
      
      // في حالة وجود منطق لتخزين حالة الإشعارات في المستقبل
      // await storage.markAllNotificationsAsRead(user.id);
      
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });
  
  // ====== واجهات برمجة التطبيقات لنظام الإنجازات ======
  
  // الحصول على بيانات إنجازات المستخدم
  app.get('/api/users/:userId/achievements', isAuthenticated, async (req, res) => {
    try {
      const requestedUserId = parseInt(req.params.userId);
      const currentUser = req.user as any;
      
      // التحقق من صحة الوصول
      if (requestedUserId !== currentUser.id && currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: 'غير مصرح بالوصول إلى بيانات هذا المستخدم' });
      }
      
      const userBookings = await storage.getUserBookings(requestedUserId);
      const userReviews = await storage.getPropertyReviews(requestedUserId);
      const userRewards = await storage.getUserRewards(requestedUserId);
      
      // تجميع البيانات اللازمة لحساب الإنجازات
      const locations = new Set<string>();
      let northCoastBookings = 0;
      let hasLuxuryBooking = false;
      
      // تحليل الحجوزات
      for (const booking of userBookings) {
        const property = await storage.getProperty(booking.propertyId);
        
        if (property) {
          // إضافة الموقع إلى المجموعة (سيتم إزالة المكررات تلقائيًا)
          locations.add(property.location);
          
          // عد حجوزات الساحل الشمالي
          if (['الساحل الشمالي', 'North Coast', 'رأس الحكمة'].includes(property.location)) {
            northCoastBookings++;
          }
          
          // التحقق من الحجوزات الفاخرة
          if (property.price >= 500) {
            hasLuxuryBooking = true;
          }
        }
      }
      
      // حساب عدد الخدمات المستخدمة
      // (في المستقبل سيتم إضافة منطق حقيقي لتتبع استخدام الخدمات)
      const uniqueServicesUsed = Math.min(Math.floor(userBookings.length / 2), 5);
      
      // تجميع البيانات
      const achievementsData = {
        bookingsCount: userBookings.length,
        reviewsCount: userReviews.length,
        uniqueBeachLocations: locations.size,
        northCoastBookings,
        hasLuxuryBooking,
        uniqueServicesUsed,
        rewardPoints: currentUser.rewardPoints || 0,
        unlockedAchievements: [] // سيتم حسابها في الواجهة الأمامية
      };
      
      res.json(achievementsData);
    } catch (error) {
      console.error('Error fetching achievements data:', error);
      res.status(500).json({ message: 'Failed to fetch achievements data' });
    }
  });
  
  // تحديد إنجاز جديد كمرئي
  app.post('/api/users/:userId/achievements/:achievementId/seen', isAuthenticated, (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievementId = req.params.achievementId;
      const currentUser = req.user as any;
      
      // التحقق من صحة الوصول
      if (userId !== currentUser.id && currentUser.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'غير مصرح بتحديث بيانات هذا المستخدم' });
      }
      
      // في حالة وجود منطق لتخزين حالة الإنجازات في المستقبل
      // await storage.markAchievementAsSeen(userId, achievementId);
      
      res.status(200).json({ message: 'Achievement marked as seen' });
    } catch (error) {
      console.error('Error marking achievement as seen:', error);
      res.status(500).json({ message: 'Failed to mark achievement as seen' });
    }
  });
  
  // ====== واجهات برمجة التطبيقات لنظام لوحة المتصدرين ======
  
  // الحصول على بيانات لوحة المتصدرين
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const period = req.query.period as string || 'all-time';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const currentUser = req.user as any;
      
      // الحصول على جميع المستخدمين
      const allUsers = await storage.getAllUsers();
      
      // فترة لوحة المتصدرين
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'weekly':
          // الأسبوع الحالي (آخر 7 أيام)
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          // الشهر الحالي (آخر 30 يومًا)
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          // كل الأوقات
          startDate = new Date(0);
      }
      
      // تجميع بيانات لوحة المتصدرين
      const leaderboardData = [];
      
      for (const user of allUsers) {
        // للتبسيط، نستخدم النقاط المخزنة في المستخدم
        // في نظام حقيقي، سنحسب النقاط المكتسبة خلال الفترة المحددة
        
        // تقدير لعدد الشارات استنادًا إلى النقاط
        const badgeCount = Math.min(Math.floor(user.rewardPoints / 200), 10);
        
        // تقدير للمستوى استنادًا إلى النقاط
        const level = Math.min(Math.max(1, Math.floor(user.rewardPoints / 300)), 5);
        
        leaderboardData.push({
          id: user.id,
          username: user.username,
          firstName: user.firstName || user.username,
          lastName: user.lastName || '',
          rewardPoints: user.rewardPoints || 0,
          badgeCount,
          level,
          isCurrentUser: currentUser ? currentUser.id === user.id : false
        });
      }
      
      // ترتيب المستخدمين حسب النقاط
      const sortedData = leaderboardData
        .sort((a, b) => b.rewardPoints - a.rewardPoints)
        .slice(0, limit);
      
      // إضافة الترتيب
      sortedData.forEach((user, index) => {
        user.rank = index + 1;
      });
      
      res.json(sortedData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboard data' });
    }
  });
  
  // ====== واجهات برمجة التطبيقات لنظام الإحالة ======
  
  // الحصول على بيانات إحالات المستخدم
  app.get('/api/users/:userId/referrals', isAuthenticated, async (req, res) => {
    try {
      const requestedUserId = parseInt(req.params.userId);
      const currentUser = req.user as any;
      
      // التحقق من صحة الوصول
      if (requestedUserId !== currentUser.id && currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: 'غير مصرح بالوصول إلى بيانات هذا المستخدم' });
      }
      
      // في نظام حقيقي، سنحصل على البيانات من قاعدة البيانات
      // أما هنا، نستخدم بيانات افتراضية لأغراض العرض
      
      // إنشاء رمز إحالة للمستخدم
      const referralCode = `CHILL${currentUser.username.toUpperCase()}25`;
      
      // افتراض بيانات إحالة
      const referralData = {
        code: referralCode,
        totalReferrals: Math.min(currentUser.id * 2, 10), // قيمة افتراضية للعرض
        pendingReferrals: Math.floor(Math.random() * 3),
        successfulReferrals: Math.min(currentUser.id, 5), // قيمة افتراضية للعرض
        totalPointsEarned: Math.min(currentUser.id * 100, 500), // قيمة افتراضية للعرض
        referralsHistory: [] as any[]
      };
      
      // إنشاء تاريخ إحالات افتراضي
      const now = new Date();
      
      for (let i = 0; i < referralData.totalReferrals; i++) {
        const isCompleted = i < referralData.successfulReferrals;
        const joinDate = new Date(now.getTime() - (30 - i) * 24 * 60 * 60 * 1000);
        
        referralData.referralsHistory.push({
          id: 100 + i,
          username: `friend${i + 1}`,
          firstName: ['محمد', 'أحمد', 'علي', 'سارة', 'فاطمة', 'مريم'][i % 6],
          lastName: ['إبراهيم', 'محمود', 'خالد', 'حسن', 'علي', 'أحمد'][i % 6],
          joinDate: joinDate.toISOString().split('T')[0],
          bookingsCount: isCompleted ? Math.floor(Math.random() * 3) + 1 : 0,
          status: isCompleted ? 'completed' : 'pending'
        });
      }
      
      res.json(referralData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      res.status(500).json({ message: 'Failed to fetch referral data' });
    }
  });

  app.get('/api/properties/:id', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `property_${propertyId}`;
      const cachedProperty = cache.get(cacheKey);
      
      if (cachedProperty) {
        logger.info('cache', `Using cached property data for ID ${propertyId}`);
        return res.json(cachedProperty);
      }
      
      // استعلام البيانات من قاعدة البيانات إذا لم تكن مخزنة مؤقتًا
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      // تخزين البيانات مؤقتًا لمدة 3 دقائق
      cache.set(cacheKey, property, cacheSettings.propertyDetails);

      res.json(property);
    } catch (error) {
      logger.error('property', 'Failed to fetch property', { error: String(error), propertyId: req.params.id });
      res.status(500).json({ message: 'Failed to fetch property' });
    }
  });

  app.post('/api/properties', isPropertyAdmin, async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const user = req.user as any;

      const newProperty = await storage.createProperty({
        ...propertyData,
        userId: user.id
      });

      res.status(201).json(newProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid property data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create property' });
    }
  });

  app.put('/api/properties/:id', isPropertyAdmin, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Check if user owns the property or is a super admin
      if (property.userId !== user.id && user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'Not authorized to update this property' });
      }

      const updatedProperty = await storage.updateProperty(propertyId, req.body);
      res.json(updatedProperty);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update property' });
    }
  });

  app.delete('/api/properties/:id', isPropertyAdmin, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Check if user owns the property or is a super admin
      if (property.userId !== user.id && user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'Not authorized to delete this property' });
      }

      await storage.deleteProperty(propertyId);
      res.json({ message: 'Property deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete property' });
    }
  });

  // Property Analytics routes for property owners
  app.get('/api/properties/:id/analytics', isAuthenticated, async (req, res) => {
    try {
      const propertyId = Number(req.params.id);
      if (isNaN(propertyId) || propertyId <= 0) {
        return res.status(400).json({ message: 'Invalid property ID' });
      }

      const { startDate, endDate } = req.query;
      const user = req.user as any;

      // Check if user has required role permissions
      if (user.role !== UserRole.PROPERTY_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        console.error(`User ${user.id} with role ${user.role} attempted to access property analytics.`);
        return res.status(403).json({ message: 'You do not have permission to access property analytics' });
      }

      // Verify property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        console.error(`Property ${propertyId} not found for analytics request.`);
        return res.status(404).json({ message: 'Property not found' });
      }

      // Verify property belongs to the current user or user is a super admin
      if (property.userId !== user.id && user.role !== UserRole.SUPER_ADMIN) {
        console.error(`User ${user.id} attempted to access analytics for property ${propertyId} owned by user ${property.userId}`);
        return res.status(403).json({ message: 'Not authorized to view analytics for this property' });
      }

      // Get bookings for this property
      const bookings = await storage.getPropertyBookings(propertyId);

      // Get reviews for this property
      const reviews = await storage.getPropertyReviews(propertyId);

      // Parse date range or default to last 30 days
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate 
        ? new Date(startDate as string) 
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before end date

      // Filter bookings by date range
      const bookingsInRange = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });

      // Calculate analytics
      const totalBookings = bookingsInRange.length;
      const totalRevenue = bookingsInRange.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate occupancy rate (booked days / total days in range)
      const totalDaysInRange = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      let bookedDays = 0;

      // Count each day that was booked in the date range
      const dateMap = new Map<string, boolean>();
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, false);
      }

      bookingsInRange.forEach(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);

        for (let d = new Date(bookingStart); d <= bookingEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (dateMap.has(dateStr)) {
            dateMap.set(dateStr, true);
          }
        }
      });

      // Count booked days
      Array.from(dateMap.values()).forEach(isBooked => {
        if (isBooked) bookedDays++;
      });

      const occupancyRate = totalDaysInRange > 0 ? (bookedDays / totalDaysInRange) * 100 : 0;

      // Calculate average rating
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Prepare response
      const analytics = {
        propertyId,
        propertyTitle: property.title,
        dateRange: {
          startDate: start,
          endDate: end
        },
        overview: {
          totalBookings,
          totalRevenue,
          avgBookingValue,
          occupancyRate,
          reviewsCount: reviews.length,
          avgRating
        },
        bookings: bookingsInRange.map(booking => ({
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          guestCount: booking.guestCount,
          totalPrice: booking.totalPrice,
          status: booking.status,
          pointsEarned: booking.pointsEarned
        })),
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        }))
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching property analytics:', error);
      res.status(500).json({ message: 'Error fetching property analytics' });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `user_bookings_${user.id}`;
      const cachedBookings = cache.get(cacheKey);
      
      if (cachedBookings) {
        logger.info('cache', `Using cached bookings for user ID ${user.id}`);
        return res.json(cachedBookings);
      }
      
      const bookings = await storage.getUserBookings(user.id);
      
      // تخزين النتيجة مؤقتًا (لمدة دقيقة واحدة)
      cache.set(cacheKey, bookings, cacheSettings.userBookings);
      
      res.json(bookings);
    } catch (error) {
      logger.error('bookings', 'Failed to fetch user bookings', { error: String(error) });
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if the booking belongs to the user or if the user is an admin
      const user = req.user as any;
      if (booking.userId !== user.id && user.role !== UserRole.PROPERTY_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'Not authorized to view this booking' });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch booking' });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const user = req.user as any;

      // Check if property exists
      const property = await storage.getProperty(bookingData.propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Calculate points earned (2 points per $1)
      const pointsEarned = Math.floor(bookingData.totalPrice * 2);

      // Set payment status based on payment method
      let paymentStatus = bookingData.paymentStatus;
      let bookingStatus = "pending";

      // If Stripe payment was successful, mark booking as confirmed
      if (bookingData.paymentMethod === "stripe" && bookingData.paymentStatus === "paid") {
        bookingStatus = "confirmed";
      }

      // If cash on arrival, mark payment as pending and booking as pending approval
      if (bookingData.paymentMethod === "cash_on_arrival") {
        paymentStatus = "pending";
        bookingStatus = "pending_approval";
      }

      const newBooking = await storage.createBooking({
        ...bookingData,
        userId: user.id,
        pointsEarned,
        status: bookingStatus,
        paymentStatus
      });

      // Create reward transaction for the booking
      await storage.createRewardTransaction({
        userId: user.id,
        bookingId: newBooking.id,
        points: pointsEarned,
        description: `Booking at ${property.title}`,
        transactionType: 'earn'
      });

      res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid booking data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });

  // Review routes
  app.get('/api/properties/:id/reviews', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `property_reviews_${propertyId}`;
      const cachedReviews = cache.get(cacheKey);
      
      if (cachedReviews) {
        logger.info('cache', `Using cached property reviews for property ID ${propertyId}`);
        return res.json(cachedReviews);
      }
      
      const reviews = await storage.getPropertyReviews(propertyId);
      
      // تخزين النتيجة مؤقتًا (لمدة 5 دقائق)
      cache.set(cacheKey, reviews, cacheSettings.propertyReviews);
      
      res.json(reviews);
    } catch (error) {
      logger.error('reviews', 'Failed to fetch property reviews', { error: String(error) });
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const user = req.user as any;

      // Check if booking exists and belongs to the user
      const booking = await storage.getBooking(reviewData.bookingId);
      if (!booking || booking.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to review this booking' });
      }

      const newReview = await storage.createReview({
        ...reviewData,
        userId: user.id
      });

      res.status(201).json(newReview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid review data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create review' });
    }
  });

  // Rewards routes
  app.get('/api/rewards', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `user_rewards_${user.id}`;
      const cachedRewards = cache.get(cacheKey);
      
      if (cachedRewards) {
        logger.info('cache', `Using cached rewards for user ID ${user.id}`);
        return res.json(cachedRewards);
      }
      
      const rewards = await storage.getUserRewards(user.id);
      
      // تخزين النتيجة مؤقتًا (لمدة دقيقة واحدة)
      cache.set(cacheKey, rewards, cacheSettings.userRewards);
      
      res.json(rewards);
    } catch (error) {
      logger.error('rewards', 'Failed to fetch user rewards', { error: String(error) });
      res.status(500).json({ message: 'Failed to fetch rewards' });
    }
  });

  app.get('/api/rewards/expiring', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const now = new Date();
      // Find transactions that will expire in the next 30 days
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const rewards = await storage.getUserRewards(user.id);
      const expiringRewards = rewards.filter(reward => 
        reward.expiryDate && 
        new Date(reward.expiryDate) > now && 
        new Date(reward.expiryDate) < thirtyDaysFromNow &&
        reward.status === 'active'
      );

      res.json(expiringRewards);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expiring rewards' });
    }
  });

  // Transactions API
  app.get('/api/rewards/transactions', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const transactions = await storage.getUserRewards(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching reward transactions:", error);
      res.status(500).json({ message: "Error fetching reward transactions" });
    }
  });

  // Redeem points API
  app.post('/api/rewards/redeem', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { points, bookingId } = req.body;

      if (!points || points <= 0) {
        return res.status(400).json({ message: "Invalid points amount" });
      }

      if (user.rewardPoints < points) {
        return res.status(400).json({ message: "Not enough points" });
      }

      // Create a redemption transaction
      const transaction = await storage.createRewardTransaction({
        userId: user.id,
        points,
        description: `Redeemed ${points} points${bookingId ? " for booking" : ""}`,
        transactionType: "redeem",
        status: "active",
        bookingId: bookingId || null
      });

      // Update user's points - this is handled in createRewardTransaction for redeem type
      // But we also update the user session
      const updatedUser = await storage.getUser(user.id);

      // Update the session
      if (updatedUser) {
        req.login(updatedUser, (err) => {
          if (err) {
            return res.status(500).json({ message: "Error updating session" });
          }
          
          res.json({ 
            transaction,
            message: "Points redeemed successfully"
          });
        });
      } else {
        res.status(500).json({ message: "Error retrieving updated user" });
      }
    } catch (error) {
      console.error("Error redeeming points:", error);
      res.status(500).json({ message: "Error redeeming points" });
    }
  });
  
  // Status API for tiers, points, and progress 
  app.get('/api/rewards/status', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `user_rewards_status_${user.id}`;
      const cachedStatus = cache.get(cacheKey);
      
      if (cachedStatus) {
        logger.info('cache', `Using cached rewards status for user ID ${user.id}`);
        return res.json(cachedStatus);
      }
      
      const transactions = await storage.getUserRewards(user.id);
      
      // Define tier thresholds
      const TIERS = {
        SILVER: { name: 'silver', threshold: 0, discountPercent: 5 },
        GOLD: { name: 'gold', threshold: 1000, discountPercent: 10 },
        PLATINUM: { name: 'platinum', threshold: 5000, discountPercent: 15 }
      };
      
      // Determine current tier
      let currentTier = TIERS.SILVER;
      let nextTier = null;
      let progress = 0;
      
      if (user.rewardPoints >= TIERS.PLATINUM.threshold) {
        currentTier = TIERS.PLATINUM;
      } else if (user.rewardPoints >= TIERS.GOLD.threshold) {
        currentTier = TIERS.GOLD;
        nextTier = {
          ...TIERS.PLATINUM,
          pointsNeeded: TIERS.PLATINUM.threshold - user.rewardPoints
        };
        progress = ((user.rewardPoints - TIERS.GOLD.threshold) / 
                   (TIERS.PLATINUM.threshold - TIERS.GOLD.threshold)) * 100;
      } else {
        currentTier = TIERS.SILVER;
        nextTier = {
          ...TIERS.GOLD,
          pointsNeeded: TIERS.GOLD.threshold - user.rewardPoints
        };
        progress = (user.rewardPoints / TIERS.GOLD.threshold) * 100;
      }
      
      // Calculate statistics
      // Calculate total earned points
      const totalEarned = transactions
        .filter(r => r.transactionType === 'earn' && r.status === 'active')
        .reduce((sum, r) => sum + r.points, 0);

      // Calculate total redeemed points
      const totalRedeemed = transactions
        .filter(r => r.transactionType === 'redeem' && r.status === 'active')
        .reduce((sum, r) => sum + r.points, 0);
        
      // Calculate statistics
      const statistics = {
        totalEarned,
        totalRedeemed,
        transactionsCount: transactions.length
      };
      
      // Calculate total transferred points (sent and received)
      let totalTransferredOut = 0;
      let totalTransferredIn = 0;
      let expiringPoints = 0;
      let expiringDate = null;

      // Check for transfers
      const transfersOut = transactions.filter(r => 
        r.transactionType === 'transfer' && 
        r.status === 'active' && 
        !r.recipientId
      );
      
      if (transfersOut.length > 0) {
        totalTransferredOut = transfersOut.reduce((sum, r) => sum + r.points, 0);
      }

      const transfersIn = transactions.filter(r => 
        r.transactionType === 'transfer' && 
        r.status === 'active' && 
        r.recipientId === user.id
      );
      
      if (transfersIn.length > 0) {
        totalTransferredIn = transfersIn.reduce((sum, r) => sum + r.points, 0);
      }

      // Check for expiring points
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const expiringTransactions = transactions.filter(reward => 
        reward.expiryDate && 
        new Date(reward.expiryDate) > now && 
        new Date(reward.expiryDate) < thirtyDaysFromNow &&
        reward.status === 'active'
      );

      if (expiringTransactions.length > 0) {
        expiringPoints = expiringTransactions.reduce((sum, r) => sum + r.points, 0);
        
        // Find earliest expiry date
        const earliestExpiry = expiringTransactions.reduce((earliest, transaction) => {
          const expiryDate = new Date(transaction.expiryDate!);
          return earliest < expiryDate ? earliest : expiryDate;
        }, new Date(thirtyDaysFromNow));

        expiringDate = earliestExpiry.toISOString();
      }

      // Calculate total available points based on all transactions
      const totalAvailable = user.rewardPoints;

      // Prepare complete response
      const statusResponse = {
        points: user.rewardPoints,
        tier: currentTier,
        nextTier,
        progress,
        statistics,
        totalTransferredOut,
        totalTransferredIn,
        totalAvailable,
        expiringPoints,
        expiringDate
      };
      
      // تخزين النتيجة مؤقتًا (لمدة دقيقة واحدة)
      cache.set(cacheKey, statusResponse, cacheSettings.userRewardsStatus);
      
      res.json(statusResponse);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reward statistics' });
    }
  });

  app.post('/api/rewards/redeem', isAuthenticated, async (req, res) => {
    try {
      const { points, description } = req.body;
      const user = req.user as any;

      // Check if user has enough points
      if (user.rewardPoints < points) {
        return res.status(400).json({ message: 'Not enough points' });
      }

      const rewardTransaction = await storage.createRewardTransaction({
        userId: user.id,
        points,
        description,
        transactionType: 'redeem',
        status: 'active'
      });

      // Update user points by subtracting redeemed amount
      await storage.updateUser(user.id, { 
        rewardPoints: user.rewardPoints - points 
      });

      // Get updated user with new point balance
      const updatedUser = await storage.getUser(user.id);

      res.json({
        transaction: rewardTransaction,
        newBalance: updatedUser?.rewardPoints
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to redeem points' });
    }
  });

  app.post('/api/rewards/transfer', isAuthenticated, async (req, res) => {
    try {
      const { points, recipientEmail, description } = req.body;
      const user = req.user as any;

      // Validate input
      if (!points || points <= 0) {
        return res.status(400).json({ message: 'Invalid point amount' });
      }

      if (!recipientEmail) {
        return res.status(400).json({ message: 'Recipient email is required' });
      }

      // Check if user has enough points
      if (user.rewardPoints < points) {
        return res.status(400).json({ message: 'Not enough points' });
      }

      // Find recipient user
      const recipient = await storage.getUserByEmail(recipientEmail);

      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }

      // Don't allow transfers to self
      if (recipient.id === user.id) {
        return res.status(400).json({ message: 'Cannot transfer points to yourself' });
      }

      // Create transaction for sender (negative points)
      const senderTransaction = await storage.createRewardTransaction({
        userId: user.id,
        points,
        description: description || `Transferred to ${recipientEmail}`,
        transactionType: 'transfer',
        recipientId: recipient.id,
        status: 'active'
      });

      // Create transaction for recipient (positive points)
      const recipientTransaction = await storage.createRewardTransaction({
        userId: recipient.id,
        points,
        description: `Received from ${user.email}`,
        transactionType: 'transfer',
        recipientId: user.id, // Store the sender's ID
        status: 'active'
      });

      // Update sender's points (subtract)
      await storage.updateUser(user.id, { 
        rewardPoints: user.rewardPoints - points 
      });

      // Update recipient's points (add)
      await storage.updateUser(recipient.id, { 
        rewardPoints: recipient.rewardPoints + points 
      });

      // Get updated sender with new point balance
      const updatedUser = await storage.getUser(user.id);

      res.json({
        senderTransaction,
        recipientTransaction,
        newBalance: updatedUser?.rewardPoints
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to transfer points' });
    }
  });

  // Admin routes
  app.get('/api/admin/users', 
    authenticateUser, 
    authorizeRoles(UserRole.SUPER_ADMIN), 
    async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.put('/api/admin/users/:id/role', 
    authenticateUser,
    authorizeRoles(UserRole.SUPER_ADMIN),
    async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      // Check for valid roles using enum values
      if (![UserRole.CUSTOMER, UserRole.PROPERTY_ADMIN, UserRole.SUPER_ADMIN].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const updatedUser = await storage.updateUser(userId, { role });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const { password, ...safeUser } = updatedUser;

      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  app.get('/api/admin/analytics', 
    authenticateUser, 
    authorizeRoles(UserRole.SUPER_ADMIN), 
    async (req, res) => {
    try {
      // Validate date parameters
      let startDate: Date;
      let endDate: Date;

      try {
        startDate = req.query.startDate 
          ? new Date(req.query.startDate as string) 
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        endDate = req.query.endDate 
          ? new Date(req.query.endDate as string) 
          : new Date();

        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid date format. Please use YYYY-MM-DD format.'
          });
        }

        // Check if date range is valid
        if (startDate > endDate) {
          return res.status(400).json({ 
            message: 'Start date cannot be after end date.'
          });
        }
      } catch (dateError) {
        return res.status(400).json({ 
          message: 'Invalid date parameters. Please use YYYY-MM-DD format.'
        });
      }

      // Get analytics data
      const analytics = await storage.getAnalytics(startDate, endDate);

      // If no analytics data is found, return empty array with a 200 status
      // This is not an error condition, just no data for the period
      res.json(analytics || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ 
        message: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Stripe payment routes
  // Payment Analytics for Stripe payments (Super Admin only)
  app.get('/api/payment-analytics', 
    authenticateUser,
    authorizeRoles(UserRole.SUPER_ADMIN),
    async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const timeRange = req.query.timeRange as string || '30d';
      const now = new Date();
      let startTime: number;

      // Calculate start time based on time range
      switch (timeRange) {
        case '7d':
          startTime = Math.floor(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime() / 1000);
          break;
        case '30d':
          startTime = Math.floor(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000);
          break;
        case '90d':
          startTime = Math.floor(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).getTime() / 1000);
          break;
        case 'ytd':
          startTime = Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);
          break;
        case 'all':
          startTime = 0; // All time
          break;
        default:
          startTime = Math.floor(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000);
      }

      // Fetch payment intents from Stripe
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        created: { gte: startTime }
      });

      // Process the payment data
      const payments = paymentIntents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        bookingId: pi.metadata.bookingId,
        customer: pi.customer as string | undefined,
        paymentMethod: pi.payment_method_types[0]
      }));

      // Calculate analytics metrics
      const totalRevenue = payments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0) / 100; // Convert from cents to dollars

      const successRate = payments.length > 0 ? 
        payments.filter(p => p.status === 'succeeded').length / payments.length : 0;

      const succeededPayments = payments.filter(p => p.status === 'succeeded');
      const averageTransaction = succeededPayments.length > 0 ? 
        (succeededPayments.reduce((sum, p) => sum + p.amount, 0) / 100) / succeededPayments.length : 0;

      // Generate daily revenue data
      const dailyRevenueMap = new Map<string, number>();

      // Initialize all dates in the range
      let currentDate = new Date(startTime * 1000);
      while (currentDate <= now) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dailyRevenueMap.set(dateStr, 0);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fill in revenue data
      succeededPayments.forEach(payment => {
        const date = new Date(payment.created * 1000).toISOString().split('T')[0];
        const currentAmount = dailyRevenueMap.get(date) || 0;
        dailyRevenueMap.set(date, currentAmount + (payment.amount / 100));
      });

      const dailyRevenue = Array.from(dailyRevenueMap.entries()).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate payment method distribution
      const paymentMethodMap = new Map<string, number>();
      succeededPayments.forEach(payment => {
        const method = payment.paymentMethod || 'unknown';
        const currentAmount = paymentMethodMap.get(method) || 0;
        paymentMethodMap.set(method, currentAmount + (payment.amount / 100));
      });

      const paymentMethodDistribution = Array.from(paymentMethodMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      // Calculate status distribution
      const statusMap = new Map<string, number>();
      payments.forEach(payment => {
        const currentCount = statusMap.get(payment.status) || 0;
        statusMap.set(payment.status, currentCount + 1);
      });

      const statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      // Return the analytics data
      res.json({
        totalRevenue,
        successRate,
        averageTransaction,
        recentPayments: payments.slice(0, 20), // Only return most recent payments
        dailyRevenue,
        paymentMethodDistribution,
        statusDistribution
      });
    } catch (error: any) {
      console.error('Error fetching payment analytics:', error);
      res.status(500).json({ message: `Error fetching payment analytics: ${error.message}` });
    }
  });

  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const { amount, bookingId, propertyId, startDate, endDate, guestCount, guestName, guestEmail, guestPhone } = req.body;

      // Apply rate limiting to prevent abuse
      const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
      const cacheKey = `payment_intent_${clientIP}`;
      const currentRequests = cache.get(cacheKey) || 0;
      
      if (currentRequests > 10) {
        return res.status(429).json({ message: 'Too many payment requests. Please try again later.' });
      }
      
      cache.set(cacheKey, currentRequests + 1, 60); // 1 minute expiry for rate limit
      
      // Create a more detailed payment intent with metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          bookingId: bookingId ? bookingId.toString() : undefined,
          propertyId: propertyId ? propertyId.toString() : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          guestCount: guestCount ? guestCount.toString() : undefined,
          guestName: guestName || undefined,
          guestEmail: guestEmail || undefined,
          guestPhone: guestPhone || undefined,
          userId: req.user ? req.user.id.toString() : undefined
        },
        // Improved payment methods to support more options
        payment_method_types: ['card'],
        receipt_email: guestEmail || (req.user ? req.user.email : undefined)
      });

      // Log the creation of the payment intent
      logger.info('payment', 'Created payment intent', { 
        paymentIntentId: paymentIntent.id,
        amount: amount,
        userId: req.user?.id || 'guest'
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      logger.error('payment', 'Error creating payment intent', { error: error.message });
      res.status(500).json({ message: `Error creating payment intent: ${error.message}` });
    }
  });
  
  // وظيفة الدفع السريع باستخدام البطاقة المحفوظة للمستخدم
  app.post('/api/quick-payment', authenticateUser, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }
      
      const {
        propertyId,
        startDate,
        endDate,
        guestCount,
        totalPrice,
        specialRequests,
        guestName,
        guestEmail,
        guestPhone
      } = req.body;
      
      const user = req.user!;
      
      // التحقق من وجود معرف العميل في Stripe
      if (!user.stripeCustomerId) {
        return res.status(400).json({ 
          message: 'لا يوجد طريقة دفع محفوظة. يرجى إضافة بطاقة أولاً.' 
        });
      }
      
      // إنشاء PaymentIntent مع استخدام البطاقة الافتراضية للعميل
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // تحويل إلى سنتات
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
        off_session: true, // مهم للدفع دون تفاعل المستخدم
        confirm: true, // تأكيد الدفع مباشرة
        metadata: {
          propertyId: propertyId.toString(),
          startDate,
          endDate,
          guestCount: guestCount.toString()
        },
        receipt_email: guestEmail || user.email
      });
      
      // إذا تم الدفع بنجاح، إنشاء الحجز في النظام
      if (paymentIntent.status === 'succeeded') {
        // إضافة نقاط المكافأة للمستخدم (2 نقطة لكل دولار)
        const pointsToAdd = Math.floor(totalPrice * 2);
        const updatedUser = await storage.updateUser(user.id, {
          rewardPoints: (user.rewardPoints || 0) + pointsToAdd
        });
        
        // إنشاء معاملة نقاط المكافأة في السجل
        await storage.createRewardTransaction({
          userId: user.id,
          points: pointsToAdd,
          type: 'earn',
          description: `كسب نقاط مقابل حجز العقار #${propertyId}`,
          createdAt: new Date()
        });
        
        // إنشاء الحجز في النظام
        const booking = await storage.createBooking({
          userId: user.id,
          propertyId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          guestCount,
          totalPrice,
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod: 'stripe',
          specialRequests: specialRequests || '',
          stripePaymentId: paymentIntent.id,
          guestName: guestName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          guestEmail: guestEmail || user.email || '',
          guestPhone: guestPhone || '',
          createdAt: new Date()
        });
        
        // إضافة إحصائيات الحجز
        const property = await storage.getProperty(propertyId);
        if (property && property.ownerId) {
          const propertyOwner = await storage.getUser(property.ownerId);
          if (propertyOwner) {
            // إرسال إشعار إلى مالك العقار (مباشرة بدلاً من استدعاء وظيفة خارجية)
            console.log(`إشعار لمالك العقار: ${propertyOwner.username} - حجز جديد #${booking.id} للعقار ${property.title}`);
            
            // هنا يمكن إضافة المزيد من منطق الإشعارات في المستقبل
            // مثل إرسال بريد إلكتروني أو إشعار عبر WebSocket
          }
        }
        
        return res.status(200).json({
          success: true,
          bookingId: booking.id,
          paymentId: paymentIntent.id,
          pointsEarned: pointsToAdd
        });
      } else {
        // إذا فشل الدفع، إرجاع الخطأ
        return res.status(400).json({
          message: 'فشل في معالجة الدفع',
          status: paymentIntent.status
        });
      }
    } catch (error: any) {
      console.error('Error processing quick payment:', error);
      
      // التعامل مع أخطاء Stripe بشكل خاص
      if (error.type === 'StripeCardError') {
        return res.status(400).json({ 
          message: 'فشل الدفع بالبطاقة: ' + error.message,
          code: error.code
        });
      }
      
      // الأخطاء العامة
      res.status(500).json({ 
        message: 'حدث خطأ أثناء معالجة الدفع السريع',
        details: error.message
      });
    }
  });

  // AI recommendation routes
  app.post('/api/recommendations', async (req, res) => {
    try {
      const { preferences } = req.body;
      const allProperties = await storage.getProperties();
      const recommendations = await matchPropertiesWithPreferences(allProperties, preferences);
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  // AI review analysis route
  app.get('/api/analytics/reviews', 
    authenticateUser,
    authorizeRoles(UserRole.SUPER_ADMIN), 
    async (req, res) => {
    try {
      // Get all reviews or filter by property ID if provided
      const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;

      let reviews;
      if (propertyId) {
        reviews = await storage.getPropertyReviews(propertyId);
      } else {
        // Get all properties
        const properties = await storage.getProperties();
        reviews = [];

        // Fetch reviews for each property
        for (const property of properties) {
          const propertyReviews = await storage.getPropertyReviews(property.id);
          reviews = [...reviews, ...propertyReviews];
        }
      }

      // Analyze reviews using Gemini AI
      const analysis = await analyzeCustomerReviews(reviews, propertyId);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      res.status(500).json({ message: 'Failed to analyze reviews' });
    }
  });

  // AI customer segmentation route
  app.get('/api/analytics/customer-segments', 
    authenticateUser,
    authorizeRoles(UserRole.SUPER_ADMIN),
    async (req, res) => {
    try {
      // Get all users
      const users = await storage.getAllUsers();

      // Enrich user data with bookings, reviews, and searches
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const bookings = await storage.getUserBookings(user.id);
        const reviews = []; // Would need to implement getUserReviews method in storage
        // const searches = await storage.getUserSearches(user.id); // Would need to implement this method

        return {
          ...user,
          bookings,
          reviews,
          // searches
        };
      }));

      // Segment customers using Gemini AI
      const segmentation = await segmentCustomers(enrichedUsers);
      res.json(segmentation);
    } catch (error) {
      console.error('Error segmenting customers:', error);
      res.status(500).json({ message: 'Failed to segment customers' });
    }
  });

  // Virtual tour generation route
  app.get('/api/properties/:id/virtual-tour', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const virtualTour = await generateVirtualTourDescription(property);
      res.json(virtualTour);
    } catch (error) {
      console.error('Error generating virtual tour:', error);
      res.status(500).json({ message: 'Failed to generate virtual tour' });
    }
  });

  // Property recommendations route
  app.post('/api/properties/recommendations', async (req, res) => {
    try {
      const preferences = req.body;

      if (!preferences) {
        return res.status(400).json({ message: 'Preferences are required' });
      }

      // Get all properties first
      const properties = await storage.getProperties(100, 0); // Fetch up to 100 properties

      if (!properties || properties.length === 0) {
        return res.status(404).json({ message: 'No properties found' });
      }

      // Use Gemini AI to match properties with preferences
      const recommendations = await matchPropertiesWithPreferences(properties, preferences);

      res.json(recommendations);
    } catch (error) {
      console.error('Error getting property recommendations:', error);
      res.status(500).json({ message: 'Failed to get property recommendations' });
    }
  });

  // Area guide generation route
  app.post('/api/properties/:id/area-guide', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const { preferences } = req.body;

      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const areaGuide = await generateAreaGuide(property, preferences);
      res.json(areaGuide);
    } catch (error) {
      console.error('Error generating area guide:', error);
      res.status(500).json({ message: 'Failed to generate area guide' });
    }
  });

  // Restaurant routes
  app.get('/api/restaurants', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const location = req.query.location as string | undefined;

      let restaurants;
      if (location) {
        restaurants = await storage.getRestaurantsByLocation(location);
      } else {
        restaurants = await storage.getRestaurants(limit, offset);
      }

      res.json(restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ message: 'Failed to fetch restaurants' });
    }
  });

  app.get('/api/restaurants/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      const restaurants = await storage.getFeaturedRestaurants(limit);
      res.json(restaurants);
    } catch (error) {
      console.error('Error fetching featured restaurants:', error);
      res.status(500).json({ message: 'Failed to fetch featured restaurants' });
    }
  });

  app.get('/api/restaurants/:id', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `restaurant_${restaurantId}`;
      const cachedRestaurant = cache.get(cacheKey);
      
      if (cachedRestaurant) {
        logger.info('cache', `Using cached restaurant data for ID ${restaurantId}`);
        return res.json(cachedRestaurant);
      }
      
      const restaurant = await storage.getRestaurant(restaurantId);

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // تخزين النتيجة مؤقتًا
      cache.set(cacheKey, restaurant, cacheSettings.restaurantDetails);

      res.json(restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      res.status(500).json({ message: 'Failed to fetch restaurant' });
    }
  });

  // Restaurant Reservation routes
  app.get('/api/restaurant-reservations', authenticateUser, async (req, res) => {
    try {
      const user = req.user as any;
      const reservations = await storage.getUserRestaurantReservations(user.id);
      res.json(reservations);
    } catch (error) {
      console.error('Error fetching restaurant reservations:', error);
      res.status(500).json({ message: 'Failed to fetch restaurant reservations' });
    }
  });

  app.post('/api/restaurant-reservations', authenticateUser, async (req, res) => {
    try {
      const reservationData = insertRestaurantReservationSchema.parse(req.body);
      const user = req.user as any;

      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(reservationData.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // Create restaurant reservation with 100 reward points
      const newReservation = await storage.createRestaurantReservation({
        ...reservationData,
        userId: user.id,
        status: 'pending',
        pointsEarned: 100 // 100 points for restaurant reservation
      });

      res.status(201).json(newReservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid reservation data', errors: error.errors });
      }
      console.error('Error creating restaurant reservation:', error);
      res.status(500).json({ message: 'Failed to create restaurant reservation' });
    }
  });

  app.get('/api/restaurant-reservations/:id', authenticateUser, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getRestaurantReservation(reservationId);

      if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
      }

      // Check if user owns the reservation or is admin
      const user = req.user as any;
      if (reservation.userId !== user.id && user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Not authorized to access this reservation' });
      }

      res.json(reservation);
    } catch (error) {
      console.error('Error fetching restaurant reservation:', error);
      res.status(500).json({ message: 'Failed to fetch restaurant reservation' });
    }
  });

  app.patch('/api/restaurant-reservations/:id', authenticateUser, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getRestaurantReservation(reservationId);

      if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
      }

      // Check if user owns the reservation or is admin
      const user = req.user as any;
      if (reservation.userId !== user.id && user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Not authorized to update this reservation' });
      }

      // Only allow updates to certain fields
      const allowedUpdates = ['partySize', 'specialRequests', 'reservationDate', 'reservationTime'];
      const filteredUpdates = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
      );

      const updatedReservation = await storage.updateRestaurantReservation(reservationId, filteredUpdates);
      res.json(updatedReservation);
    } catch (error) {
      console.error('Error updating restaurant reservation:', error);
      res.status(500).json({ message: 'Failed to update restaurant reservation' });
    }
  });

  app.delete('/api/restaurant-reservations/:id', authenticateUser, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getRestaurantReservation(reservationId);

      if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
      }

      // Check if user owns the reservation or is admin
      const user = req.user as any;
      if (reservation.userId !== user.id && user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
      }

      // Cancel the reservation (this also handles reward point reversal)
      const success = await storage.cancelRestaurantReservation(reservationId);

      if (success) {
        res.json({ message: 'Reservation cancelled successfully' });
      } else {
        res.status(500).json({ message: 'Failed to cancel reservation' });
      }
    } catch (error) {
      console.error('Error cancelling restaurant reservation:', error);
      res.status(500).json({ message: 'Failed to cancel restaurant reservation' });
    }
  });

  // Restaurant Review routes
  app.get('/api/restaurants/:id/reviews', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // التحقق من وجود البيانات في التخزين المؤقت أولاً
      const cacheKey = `restaurant_reviews_${restaurantId}`;
      const cachedReviews = cache.get(cacheKey);
      
      if (cachedReviews) {
        logger.info('cache', `Using cached restaurant reviews for restaurant ID ${restaurantId}`);
        return res.json(cachedReviews);
      }

      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      const reviews = await storage.getRestaurantReviews(restaurantId);
      
      // تخزين النتيجة مؤقتًا (لمدة دقيقتين)
      cache.set(cacheKey, reviews, cacheSettings.restaurantReviews || 120);
      
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching restaurant reviews:', error);
      res.status(500).json({ message: 'Failed to fetch restaurant reviews' });
    }
  });

  app.post('/api/restaurants/:id/reviews', authenticateUser, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // User can only review restaurants they've reserved 
      // This is commented out as it's a free service so we want to allow any user to review
      // const userReservations = await storage.getUserRestaurantReservations(user.id);
      // const hasReservation = userReservations.some(r => r.restaurantId === restaurantId);
      // if (!hasReservation) {
      //   return res.status(403).json({ message: 'You can only review restaurants you have reserved' });
      // }

      // Create the review
      const reviewData = insertRestaurantReviewSchema.parse(req.body);
      const newReview = await storage.createRestaurantReview({
        ...reviewData,
        userId: user.id,
        restaurantId
      });

      res.status(201).json(newReview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid review data', errors: error.errors });
      }
      console.error('Error creating restaurant review:', error);
      res.status(500).json({ message: 'Failed to create restaurant review' });
    }
  });

  // Seed some initial restaurants if none exist - only for development
  app.post('/api/dev/seed-restaurants', async (req, res) => {
    try {
      // Check if restaurants already exist
      const existingRestaurants = await storage.getRestaurants();
      if (existingRestaurants.length > 0) {
        return res.status(400).json({ 
          message: 'Restaurants already exist in the database', 
          count: existingRestaurants.length 
        });
      }

      // El Sahel restaurants
      await storage.createRestaurant({
        name: "Sea Breeze Lounge",
        description: "Upscale seafood restaurant with breathtaking views of the Mediterranean coast.",
        location: "El Sahel",
        address: "Marina Gate 5, North Coast Highway, El Sahel",
        cuisineType: "Seafood",
        priceRange: "$$$",
        images: [
          "https://images.unsplash.com/photo-1554679665-f5537f187268?auto=format&fit=crop&w=600&q=80",
          "https:images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"
        ],
        openingTime: "12:00",
        closingTime: "00:00",
        contactPhone: "+20 123-456-7890",
        contactEmail: "info@seabreezelounge.com",
        website: "https://www.seabreezelounge.com",
        featured: true,
        active: true
      });

      await storage.createRestaurant({
        name: "Sahel Nights",
        description: "A vibrant Middle Eastern eatery with live music and authentic dishes.",
        location: "El Sahel",
        address: "Marassi Beach Club, North Coast, El Sahel",
        cuisineType: "Middle Eastern",
        priceRange: "$$",
        images: [
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1533777324565-a040eb52facd?auto=format&fit=crop&w=600&q=80"
        ],
        openingTime: "18:00",
        closingTime: "02:00",
        contactPhone: "+20 123-456-7891",
        contactEmail: "reservations@sahelnights.com",
        website: "https://www.sahelnights.com",
        featured: true,
        active: true
      });

      // Ras El Hekma restaurants
      await storage.createRestaurant({
        name: "Hekma Bay",
        description: "Fresh Mediterranean cuisine in an elegant setting with panoramic sea views.",
        location: "Ras El Hekma",
        address: "Hekma Bay Resort, Ras El Hekma",
        cuisineType: "Mediterranean",
        priceRange: "$$$",
        images: [
          "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=600&q=80"
        ],
        openingTime: "13:00",
        closingTime: "23:00",
        contactPhone: "+20 123-456-7892",
        contactEmail: "dine@hekmabay.com",
        website: "https://www.hekmabay.com",
        featured: true,
        active: true
      });

      await storage.createRestaurant({
        name: "Bedouin Grill",
        description: "Traditional Egyptian grilled meat and fish dishes with authentic Bedouin atmosphere.",
        location: "Ras El Hekma",
        address: "Fouka Bay, Ras El Hekma",
        cuisineType: "Egyptian Grill",
        priceRange: "$$",
        images: [
          "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
        ],
        openingTime: "17:00",
        closingTime: "01:00",
        contactPhone: "+20 123-456-7893",
        contactEmail: "info@bedouingrill.com",
        website: "https://www.bedouingrill.com",
        featured: false,
        active: true
      });

      res.status(201).json({ message: 'Restaurants seeded successfully' });
    } catch (error) {
      console.error('Error seeding restaurants:', error);
      res.status(500).json({ message: 'Failed to seed restaurants' });
    }
  });

  // Trip Planning Routes
  // Get user's owned trip plans
  app.get('/api/trip-plans', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const tripPlans = await storage.getUserTripPlans(user.id);
      res.json(tripPlans);
    } catch (error) {
      console.error('Error fetching trip plans:', error);
      res.status(500).json({ message: 'Failed to fetch trip plans' });
    }
  });

  // Get shared trip plans (plans where the user is a collaborator)
  app.get('/api/trip-plans/shared', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const tripPlans = await storage.getSharedTripPlans(user.id);
      res.json(tripPlans);
    } catch (error) {
      console.error('Error fetching shared trip plans:', error);
      res.status(500).json({ message: 'Failed to fetch shared trip plans' });
    }
  });

  // Get a specific trip plan
  app.get('/api/trip-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user has access to this trip plan
      const user = req.user as any;
      if (
        tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id) && 
        !tripPlan.isPublic
      ) {
        return res.status(403).json({ message: 'Not authorized to view this trip plan' });
      }

      // Get all trip items for this plan
      const tripItems = await storage.getTripItems(tripPlanId);

      res.json({
        tripPlan,
        tripItems
      });
    } catch (error) {
      console.error('Error fetching trip plan:', error);
      res.status(500).json({ message: 'Failed to fetch trip plan' });
    }
  });

  // Get a trip plan by invite code
  app.get('/api/trip-plans/invite/:code', async (req, res) => {
    try {
      const inviteCode = req.params.code;
      const tripPlan = await storage.getTripPlanByInviteCode(inviteCode);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      res.json(tripPlan);
    } catch (error) {
      console.error('Error fetching trip plan by invite code:', error);
      res.status(500).json({ message: 'Failed to fetch trip plan' });
    }
  });

  // Create a new trip plan
  app.post('/api/trip-plans', isAuthenticated, async (req, res) => {
    try {
      const tripPlanData = insertTripPlanSchema.parse(req.body);
      const user = req.user as any;

      const newTripPlan = await storage.createTripPlan({
        ...tripPlanData,
        ownerId: user.id
      });

      res.status(201).json(newTripPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid trip plan data', errors: error.errors });
      }
      console.error('Error creating trip plan:', error);
      res.status(500).json({ message: 'Failed to create trip plan' });
    }
  });

  // Update a trip plan
  app.put('/api/trip-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user is authorized to update this trip plan
      const user = req.user as any;
      if (tripPlan.ownerId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update this trip plan' });
      }

      const updatedTripPlan = await storage.updateTripPlan(tripPlanId, req.body);
      res.json(updatedTripPlan);
    } catch (error) {
      console.error('Error updating trip plan:', error);
      res.status(500).json({ message: 'Failed to update trip plan' });
    }
  });

  // Delete a trip plan
  app.delete('/api/trip-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user is authorized to delete this trip plan
      const user = req.user as any;
      if (tripPlan.ownerId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this trip plan' });
      }

      await storage.deleteTripPlan(tripPlanId);
      res.json({ message: 'Trip plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting trip plan:', error);
      res.status(500).json({ message: 'Failed to delete trip plan' });
    }
  });

  // Trip Items Routes
  // Get all trip items for a trip
  app.get('/api/trip-plans/:id/items', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user has access to this trip plan
      const user = req.user as any;
      if (
        tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id) && 
        !tripPlan.isPublic
      ) {
        return res.status(403).json({ message: 'Not authorized to view this trip plan' });
      }

      const tripItems = await storage.getTripItems(tripPlanId);
      res.json(tripItems);
    } catch (error) {
      console.error('Error fetching trip items:', error);
      res.status(500).json({ message: 'Failed to fetch trip items' });
    }
  });

  // Get a specific trip item
  app.get('/api/trip-items/:id', isAuthenticated, async (req, res) => {
    try {
      const tripItemId = parseInt(req.params.id);
      const tripItem = await storage.getTripItem(tripItemId);

      if (!tripItem) {
        return res.status(404).json({ message: 'Trip item not found' });
      }

      // Check if user has access to the trip plan this item belongs to
      const user = req.user as any;
      const tripPlan = await storage.getTripPlan(tripItem.tripId);

      if (
        !tripPlan || 
        (tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id) && 
        !tripPlan.isPublic)
      ) {
        return res.status(403).json({ message: 'Not authorized to view this trip item' });
      }

      res.json(tripItem);
    } catch (error) {
      console.error('Error fetching trip item:', error);
      res.status(500).json({ message: 'Failed to fetch trip item' });
    }
  });

  // Create a new trip item
  app.post('/api/trip-plans/:id/items', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user has access to add items to this trip plan
      const user = req.user as any;
      if (
        tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id)
      ) {
        return res.status(403).json({ message: 'Not authorized to add items to this trip plan' });
      }

      // Validate the item type
      const tripItemData = insertTripItemSchema.parse({
        ...req.body,
        tripId: tripPlanId,
        createdBy: user.id
      });

      const newTripItem = await storage.createTripItem(tripItemData);

      // Notify connected clients about the change
      notifyTripPlanUpdate(tripPlanId, {
        type: 'ITEM_ADDED',
        data: newTripItem,
        userId: user.id
      });

      res.status(201).json(newTripItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid trip item data', errors: error.errors });
      }
      console.error('Error creating trip item:', error);
      res.status(500).json({ message: 'Failed to create trip item' });
    }
  });

  // Update a trip item
  app.put('/api/trip-items/:id', isAuthenticated, async (req, res) => {
    try {
      const tripItemId = parseInt(req.params.id);
      const tripItem = await storage.getTripItem(tripItemId);

      if (!tripItem) {
        return res.status(404).json({ message: 'Trip item not found' });
      }

      // Check if user has access to update this item
      const user = req.user as any;
      const tripPlan = await storage.getTripPlan(tripItem.tripId);

      if (
        !tripPlan || 
        (tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id))
      ) {
        return res.status(403).json({ message: 'Not authorized to update this trip item' });
      }

      const updateData = { 
        ...req.body,
        lastModifiedBy: user.id
      };

      const updatedTripItem = await storage.updateTripItem(tripItemId, updateData);

      // Notify connected clients about the change
      notifyTripPlanUpdate(tripItem.tripId, {
        type: 'ITEM_UPDATED',
        data: updatedTripItem,
        userId: user.id
      });

      res.json(updatedTripItem);
    } catch (error) {
      console.error('Error updating trip item:', error);
      res.status(500).json({ message: 'Failed to update trip item' });
    }
  });

  // Delete a trip item
  app.delete('/api/trip-items/:id', isAuthenticated, async (req, res) => {
    try {
      const tripItemId = parseInt(req.params.id);
      const tripItem = await storage.getTripItem(tripItemId);

      if (!tripItem) {
        return res.status(404).json({ message: 'Trip item not found' });
      }

      // Check if user has access to delete this item
      const user = req.user as any;
      const tripPlan = await storage.getTripPlan(tripItem.tripId);

      if (
        !tripPlan || 
        (tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id))
      ) {
        return res.status(403).json({ message: 'Not authorized to delete this trip item' });
      }

      const tripPlanId = tripItem.tripId;
      await storage.deleteTripItem(tripItemId);

      // Notify connected clients about the change
      notifyTripPlanUpdate(tripPlanId, {
        type: 'ITEM_DELETED',
        data: { id: tripItemId },
        userId: user.id
      });

      res.json({ message: 'Trip item deleted successfully' });
    } catch (error) {
      console.error('Error deleting trip item:', error);
      res.status(500).json({ message: 'Failed to delete trip item' });
    }
  });

  // Trip Comments Routes
  // Get all comments for a trip plan
  app.get('/api/trip-plans/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripItemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;

      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user has access to this trip plan
      const user = req.user as any;
      if (
        tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id) && 
        !tripPlan.isPublic
      ) {
        return res.status(403).json({ message: 'Not authorized to view comments for this trip plan' });
      }

      const comments = await storage.getTripComments(tripPlanId, tripItemId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching trip comments:', error);
      res.status(500).json({ message: 'Failed to fetch trip comments' });
    }
  });

  // Add a comment to a trip plan or trip item
  app.post('/api/trip-plans/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const tripPlanId = parseInt(req.params.id);
      const tripPlan = await storage.getTripPlan(tripPlanId);

      if (!tripPlan) {
        return res.status(404).json({ message: 'Trip plan not found' });
      }

      // Check if user has access to comment on this trip plan
      const user = req.user as any;
      if (
        tripPlan.ownerId !== user.id && 
        !tripPlan.collaborators.includes(user.id)
      ) {
        return res.status(403).json({ message: 'Not authorized to comment on this trip plan' });
      }

      // If comment is for a specific trip item, verify it exists
      if (req.body.tripItemId) {
        const tripItem = await storage.getTripItem(req.body.tripItemId);
        if (!tripItem || tripItem.tripId !== tripPlanId) {
          return res.status(404).json({ message: 'Trip item not found or does not belong to this trip plan' });
        }
      }

      const commentData = insertTripCommentSchema.parse({
        ...req.body,
        tripId: tripPlanId,
        userId: user.id
      });

      const newComment = await storage.createTripComment(commentData);

      // Notify connected clients about the new comment
      notifyTripPlanUpdate(tripPlanId, {
        type: 'COMMENT_ADDED',
        data: newComment,
        userId: user.id
      });

      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid comment data', errors: error.errors });
      }
      console.error('Error creating trip comment:', error);
      res.status(500).json({ message: 'Failed to create trip comment' });
    }
  });

  // Services routes - for all services including restaurants, cleaning, delivery, car rental
  app.get('/api/services', async (req, res) => {
    try {
      // Get query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const type = req.query.type as string | undefined;
      
      // First convert restaurants to services format
      const restaurants = await storage.getRestaurants(limit, offset);
      
      let services = restaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        location: restaurant.location,
        serviceType: 'restaurant',
        priceRange: restaurant.priceRange,
        image: restaurant.images?.[0] || '/images/placeholder-restaurant.jpg',
        available: restaurant.active,
        availabilityTime: `${restaurant.openingTime.substring(0, 5)} - ${restaurant.closingTime.substring(0, 5)}`,
        rating: restaurant.rating,
        featured: restaurant.featured,
        comingSoon: false,
        restaurantId: restaurant.id,
        contactPhone: restaurant.contactPhone,
        contactEmail: restaurant.contactEmail,
        createdAt: restaurant.createdAt
      }));
      
      // Add coming soon services
      const comingSoonServices = [
        {
          id: 1001,
          name: "خدمة تنظيف المنازل",
          description: "خدمة تنظيف احترافية مع عمالة مدربة وأدوات متطورة للعناية بمنزلك",
          location: "جميع المواقع",
          serviceType: "cleaning",
          priceRange: "$$",
          image: "/images/services/cleaning-service.jpg",
          available: false,
          comingSoon: true,
          featured: true,
          contactPhone: "+201234567890",
          contactEmail: "cleaning@staychill.com",
          createdAt: new Date()
        },
        {
          id: 1002,
          name: "خدمة توصيل المشتريات والطلبات",
          description: "خدمة توصيل سريعة وآمنة للمشتريات والطلبات من المتاجر والمطاعم",
          location: "الساحل ورأس الحكمة",
          serviceType: "delivery",
          priceRange: "$",
          image: "/images/services/delivery-service.jpg",
          available: false,
          comingSoon: true,
          contactPhone: "+201234567891",
          contactEmail: "delivery@staychill.com",
          createdAt: new Date()
        },
        {
          id: 1003,
          name: "خدمة حجز السيارات",
          description: "استئجار سيارات فاخرة واقتصادية مع خيارات توصيل وإعادة في أي مكان",
          location: "جميع المواقع",
          serviceType: "car",
          priceRange: "$$$",
          image: "/images/services/car-rental.jpg",
          available: false,
          comingSoon: true,
          featured: true,
          contactPhone: "+201234567892",
          contactEmail: "cars@staychill.com",
          createdAt: new Date()
        }
      ];
      
      // Add coming soon services to the list
      services = [...services, ...comingSoonServices];
      
      // Filter by service type if specified
      if (type) {
        services = services.filter(service => service.serviceType === type);
      }
      
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  // Featured services
  app.get('/api/services/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      
      // Get featured restaurants
      const featuredRestaurants = await storage.getFeaturedRestaurants(limit);
      
      // Convert to services format
      let featuredServices = featuredRestaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        location: restaurant.location,
        serviceType: 'restaurant',
        priceRange: restaurant.priceRange,
        image: restaurant.images?.[0] || '/images/placeholder-restaurant.jpg',
        available: restaurant.active,
        availabilityTime: `${restaurant.openingTime.substring(0, 5)} - ${restaurant.closingTime.substring(0, 5)}`,
        rating: restaurant.rating,
        featured: true,
        comingSoon: false,
        restaurantId: restaurant.id,
        contactPhone: restaurant.contactPhone,
        contactEmail: restaurant.contactEmail,
        createdAt: restaurant.createdAt
      }));
      
      // Add featured coming soon services
      const featuredComingSoonServices = [
        {
          id: 1001,
          name: "خدمة تنظيف المنازل",
          description: "خدمة تنظيف احترافية مع عمالة مدربة وأدوات متطورة للعناية بمنزلك",
          location: "جميع المواقع",
          serviceType: "cleaning",
          priceRange: "$$",
          image: "/images/services/cleaning-service.jpg",
          available: false,
          comingSoon: true,
          featured: true,
          contactPhone: "+201234567890",
          contactEmail: "cleaning@staychill.com",
          createdAt: new Date()
        },
        {
          id: 1003,
          name: "خدمة حجز السيارات",
          description: "استئجار سيارات فاخرة واقتصادية مع خيارات توصيل وإعادة في أي مكان",
          location: "جميع المواقع",
          serviceType: "car",
          priceRange: "$$$",
          image: "/images/services/car-rental.jpg",
          available: false,
          comingSoon: true,
          featured: true,
          contactPhone: "+201234567892",
          contactEmail: "cars@staychill.com",
          createdAt: new Date()
        }
      ];
      
      // Add featured coming soon services to the list
      featuredServices = [...featuredServices, ...featuredComingSoonServices];
      
      res.json(featuredServices);
    } catch (error) {
      console.error('Error fetching featured services:', error);
      res.status(500).json({ message: 'Failed to fetch featured services' });
    }
  });

  // Coming soon services
  app.get('/api/services/coming-soon', async (req, res) => {
    try {
      // Send the coming soon services
      const comingSoonServices = [
        {
          id: 1001,
          name: "خدمة تنظيف المنازل",
          description: "خدمة تنظيف احترافية مع عمالة مدربة وأدوات متطورة للعناية بمنزلك",
          location: "جميع المواقع",
          serviceType: "cleaning",
          priceRange: "$$",
          image: "/images/services/cleaning-service.jpg",
          available: false,
          comingSoon: true,
          featured: true,
          contactPhone: "+201234567890",
          contactEmail: "cleaning@staychill.com",
          createdAt: new Date()
        },
        {
          id: 1002,
          name: "خدمة توصيل المشتريات والطلبات",
          description: "خدمة توصيل سريعة وآمنة للمشتريات والطلبات من المتاجر والمطاعم",
          location: "الساحل ورأس الحكمة",
          serviceType: "delivery",
          priceRange: "$",
          image: "/images/services/delivery-service.jpg",
          available: false,
          comingSoon: true,
          contactPhone: "+201234567891",
          contactEmail: "delivery@staychill.com",
          createdAt: new Date()
        },
        {
          id: 1003,
          name: "خدمة حجز السيارات",
          description: "استئجار سيارات فاخرة واقتصادية مع خيارات توصيل وإعادة في أي مكان",
          location: "جميع المواقع",
          serviceType: "car",
          priceRange: "$$$",
          image: "/images/services/car-rental.jpg",
          available: false,
          comingSoon: true,
          featured: true,
          contactPhone: "+201234567892",
          contactEmail: "cars@staychill.com",
          createdAt: new Date()
        }
      ];
      
      res.json(comingSoonServices);
    } catch (error) {
      console.error('Error fetching coming soon services:', error);
      res.status(500).json({ message: 'Failed to fetch coming soon services' });
    }
  });

  // ------ Chat API Routes ------
  
  // Get user conversations
  app.get("/api/chat/conversations", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let userId: number;
      
      if (req.user) {
        userId = req.user.id;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const conversations = await storage.getUserConversations(userId);
      
      // For each conversation, get the participants and add user info
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const participants = await storage.getConversationParticipants(conversation.id);
          
          // Get user details for each participant
          const participantsWithDetails = await Promise.all(
            participants.map(async (participant) => {
              const user = await storage.getUser(participant.userId);
              return {
                ...participant,
                user: user ? {
                  id: user.id,
                  username: user.username,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatar: user.avatar
                } : null
              };
            })
          );
          
          // Get the last message
          const messages = await storage.getConversationMessages(conversation.id, 1);
          const lastMessage = messages.length > 0 ? messages[0] : null;
          
          // If this is a property inquiry, get the property details
          let property = null;
          if (conversation.type === ChatType.PROPERTY_INQUIRY && conversation.propertyId) {
            property = await storage.getProperty(conversation.propertyId);
            if (property) {
              property = {
                id: property.id,
                title: property.title,
                location: property.location,
                thumbnail: property.images.length > 0 ? property.images[0] : null
              };
            }
          }
          
          // If this is a booking support conversation, get booking details
          let booking = null;
          if (conversation.type === ChatType.BOOKING_SUPPORT && conversation.bookingId) {
            booking = await storage.getBooking(conversation.bookingId);
            if (booking) {
              const bookingProperty = await storage.getProperty(booking.propertyId);
              booking = {
                id: booking.id,
                status: booking.status,
                startDate: booking.startDate,
                endDate: booking.endDate,
                propertyTitle: bookingProperty ? bookingProperty.title : 'Unknown Property'
              };
            }
          }
          
          return {
            ...conversation,
            participants: participantsWithDetails,
            lastMessage,
            property,
            booking,
            unreadCount: messages.filter(m => !m.isRead && m.senderId !== userId).length
          };
        })
      );
      
      res.json(conversationsWithDetails);
    } catch (error) {
      logger.error('chat', 'Error fetching user conversations', { error: String(error) });
      res.status(500).json({ error: "Error fetching conversations" });
    }
  });
  
  // Get a specific conversation
  app.get("/api/chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let userId: number;
      
      if (req.user) {
        userId = req.user.id;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const conversationId = parseInt(req.params.id);
      
      // Check if conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check if user is a participant
      const participants = await storage.getConversationParticipants(conversationId);
      const isParticipant = participants.some(p => p.userId === userId);
      
      if (!isParticipant && req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ error: "You are not a participant in this conversation" });
      }
      
      // Get participants with user details
      const participantsWithDetails = await Promise.all(
        participants.map(async (participant) => {
          const user = await storage.getUser(participant.userId);
          return {
            ...participant,
            user: user ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            } : null
          };
        })
      );
      
      // Get property details if this is a property inquiry
      let property = null;
      if (conversation.type === ChatType.PROPERTY_INQUIRY && conversation.propertyId) {
        property = await storage.getProperty(conversation.propertyId);
        if (property) {
          const owner = await storage.getUser(property.userId);
          property = {
            id: property.id,
            title: property.title,
            location: property.location,
            images: property.images,
            owner: owner ? {
              id: owner.id,
              username: owner.username,
              firstName: owner.firstName,
              lastName: owner.lastName
            } : null
          };
        }
      }
      
      // Get booking details if this is a booking support conversation
      let booking = null;
      if (conversation.type === ChatType.BOOKING_SUPPORT && conversation.bookingId) {
        booking = await storage.getBooking(conversation.bookingId);
        if (booking) {
          const bookingProperty = await storage.getProperty(booking.propertyId);
          booking = {
            id: booking.id,
            status: booking.status,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            guestCount: booking.guestCount,
            propertyTitle: bookingProperty ? bookingProperty.title : 'Unknown Property',
            propertyId: booking.propertyId
          };
        }
      }
      
      const conversationDetails = {
        ...conversation,
        participants: participantsWithDetails,
        property,
        booking
      };
      
      res.json(conversationDetails);
    } catch (error) {
      logger.error('chat', 'Error fetching conversation details', { error: String(error) });
      res.status(500).json({ error: "Error fetching conversation details" });
    }
  });
  
  // Get messages for a conversation
  app.get("/api/chat/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let userId: number;
      
      if (req.user) {
        userId = req.user.id;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const conversationId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Check if conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check if user is a participant
      const participants = await storage.getConversationParticipants(conversationId);
      const isParticipant = participants.some(p => p.userId === userId);
      
      if (!isParticipant && req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ error: "You are not a participant in this conversation" });
      }
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      // Get messages
      const messages = await storage.getConversationMessages(conversationId, limit, offset);
      
      // Add sender info to each message
      const messagesWithSenderInfo = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender: sender ? {
              id: sender.id,
              username: sender.username,
              firstName: sender.firstName,
              lastName: sender.lastName,
              avatar: sender.avatar
            } : null
          };
        })
      );
      
      res.json(messagesWithSenderInfo);
    } catch (error) {
      logger.error('chat', 'Error fetching conversation messages', { error: String(error) });
      res.status(500).json({ error: "Error fetching conversation messages" });
    }
  });
  
  // Create a new conversation
  app.post("/api/chat/conversations", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let userId: number;
      let userRole: string = UserRole.CUSTOMER;
      
      if (req.user) {
        userId = req.user.id;
        userRole = req.user.role;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
        userRole = user.role;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // التحقق من صحة بيانات الطلب
      const validationResult = insertChatConversationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      const conversationData = validationResult.data;
      
      // التحقق من أنواع المحادثات المختلفة
      if (conversationData.type === ChatType.PROPERTY_INQUIRY) {
        if (!conversationData.propertyId) {
          return res.status(400).json({ error: "Property ID is required for property inquiries" });
        }
        
        // التحقق من وجود العقار
        const property = await storage.getProperty(conversationData.propertyId);
        if (!property) {
          return res.status(404).json({ error: "Property not found" });
        }
        
        // تعيين عنوان المحادثة إذا لم يتم توفيره
        if (!conversationData.title) {
          conversationData.title = `Inquiry about ${property.title}`;
        }
        
        // إضافة مالك العقار كمشارك تلقائيًا
        const propertyOwner = await storage.getUser(property.userId);
        if (!propertyOwner) {
          return res.status(404).json({ error: "Property owner not found" });
        }
        
        // التحقق من أن المستخدم ليس هو نفسه مالك العقار
        if (propertyOwner.id === userId && userRole !== UserRole.SUPER_ADMIN) {
          return res.status(400).json({ error: "You cannot create an inquiry for your own property" });
        }
      } else if (conversationData.type === ChatType.BOOKING_SUPPORT) {
        if (!conversationData.bookingId) {
          return res.status(400).json({ error: "Booking ID is required for booking support" });
        }
        
        // التحقق من وجود الحجز
        const booking = await storage.getBooking(conversationData.bookingId);
        if (!booking) {
          return res.status(404).json({ error: "Booking not found" });
        }
        
        // التحقق من أن المستخدم هو صاحب الحجز أو مالك العقار أو مسؤول
        const property = await storage.getProperty(booking.propertyId);
        if (!property) {
          return res.status(404).json({ error: "Property not found" });
        }
        
        const isBookingOwner = booking.userId === userId;
        const isPropertyOwner = property.userId === userId;
        const isAdmin = userRole === UserRole.SUPER_ADMIN;
        
        if (!isBookingOwner && !isPropertyOwner && !isAdmin) {
          return res.status(403).json({ error: "You are not authorized to create a support conversation for this booking" });
        }
        
        // تعيين عنوان المحادثة إذا لم يتم توفيره
        if (!conversationData.title) {
          conversationData.title = `Support for booking #${booking.id}`;
        }
        
        // إضافة العقار إلى بيانات المحادثة
        conversationData.propertyId = booking.propertyId;
      }
      
      // إنشاء المحادثة
      const conversation = await storage.createConversation(conversationData);
      
      // إضافة المستخدم الحالي كمشارك
      await storage.addParticipantToConversation({
        conversationId: conversation.id,
        userId,
        isAdmin: true
      });
      
      // إضافة مشاركين إضافيين إذا تم توفيرهم
      const participantIds = req.body.participantIds as number[] || [];
      
      if (participantIds.length > 0) {
        for (const participantId of participantIds) {
          // التحقق من وجود المستخدم
          const participantUser = await storage.getUser(participantId);
          if (participantUser) {
            await storage.addParticipantToConversation({
              conversationId: conversation.id,
              userId: participantId,
              isAdmin: false
            });
          }
        }
      }
      
      // إذا كانت محادثة استعلام عن عقار، أضف مالك العقار كمشارك
      if (conversation.type === ChatType.PROPERTY_INQUIRY && conversation.propertyId) {
        const property = await storage.getProperty(conversation.propertyId);
        if (property && property.userId !== userId) {
          await storage.addParticipantToConversation({
            conversationId: conversation.id,
            userId: property.userId,
            isAdmin: true
          });
        }
      }
      
      // إذا كانت محادثة دعم للحجز، أضف مالك العقار والمستخدم صاحب الحجز كمشاركين
      if (conversation.type === ChatType.BOOKING_SUPPORT && conversation.bookingId) {
        const booking = await storage.getBooking(conversation.bookingId);
        if (booking) {
          // أضف صاحب الحجز إذا لم يكن هو المستخدم الحالي
          if (booking.userId !== userId) {
            await storage.addParticipantToConversation({
              conversationId: conversation.id,
              userId: booking.userId,
              isAdmin: false
            });
          }
          
          // أضف مالك العقار إذا لم يكن هو المستخدم الحالي
          const property = await storage.getProperty(booking.propertyId);
          if (property && property.userId !== userId && property.userId !== booking.userId) {
            await storage.addParticipantToConversation({
              conversationId: conversation.id,
              userId: property.userId,
              isAdmin: true
            });
          }
        }
      }
      
      // سجل حدث التدقيق
      logAuditEvent(req, {
        action: "create_conversation",
        userId,
        userRole,
        resource: ResourceType.CHAT,
        resourceId: conversation.id,
        success: true,
        details: { conversationType: conversation.type }
      });
      
      // إعادة الحصول على المحادثة مع المشاركين
      const participants = await storage.getConversationParticipants(conversation.id);
      
      const participantsWithDetails = await Promise.all(
        participants.map(async (participant) => {
          const user = await storage.getUser(participant.userId);
          return {
            ...participant,
            user: user ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            } : null
          };
        })
      );
      
      res.status(201).json({
        ...conversation,
        participants: participantsWithDetails
      });
    } catch (error) {
      logger.error('chat', 'Error creating conversation', { error: String(error) });
      res.status(500).json({ error: "Error creating conversation" });
    }
  });
  
  // Send a message in a conversation
  app.post("/api/chat/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      // التحقق من المصادقة
      if (!req.isAuthenticated() && !req.firebaseUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let userId: number;
      
      if (req.user) {
        userId = req.user.id;
      } else if (req.firebaseUser) {
        const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const conversationId = parseInt(req.params.id);
      
      // التحقق من وجود المحادثة
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // التحقق من أن المستخدم مشارك في المحادثة
      const participants = await storage.getConversationParticipants(conversationId);
      const isParticipant = participants.some(p => p.userId === userId);
      
      if (!isParticipant && req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ error: "You are not a participant in this conversation" });
      }
      
      // التحقق من صحة بيانات الطلب
      const validationResult = insertChatMessageSchema.safeParse({
        ...req.body,
        conversationId,
        senderId: userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      const messageData = validationResult.data;
      
      // إنشاء الرسالة
      const message = await storage.createMessage(messageData);
      
      // الحصول على معلومات المرسل
      const sender = await storage.getUser(userId);
      
      // إضافة معلومات المرسل للرسالة
      const messageWithSenderInfo = {
        ...message,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          firstName: sender.firstName,
          lastName: sender.lastName,
          avatar: sender.avatar
        } : null
      };
      
      res.status(201).json(messageWithSenderInfo);
    } catch (error) {
      logger.error('chat', 'Error sending message', { error: String(error) });
      res.status(500).json({ error: "Error sending message" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server setup for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections by trip plan ID (for trip planning feature)
  const tripConnections: Map<number, Set<{ ws: WebSocket, userId: number }>> = new Map();
  
  // Store active chat connections by user ID (for chat feature)
  const chatConnections: Map<number, Set<WebSocket>> = new Map();

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    let connectedTripId: number | null = null;
    let connectedUserId: number | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle join trip plan room
        if (data.type === 'JOIN_TRIP') {
          const tripId = parseInt(data.tripId);
          const userId = parseInt(data.userId);

          connectedTripId = tripId;
          connectedUserId = userId;

          console.log(`User ${userId} joined trip plan ${tripId}`);

          // Add this connection to the trip plan's connections
          if (!tripConnections.has(tripId)) {
            tripConnections.set(tripId, new Set());
          }

          tripConnections.get(tripId)?.add({ ws, userId });

          // Send confirmation to the client
          ws.send(JSON.stringify({
            type: 'JOINED_TRIP',
            tripId,
            status: 'success'
          }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');

      // Clean up connection when user disconnects
      if (connectedTripId && connectedUserId) {
        const tripConnectionSet = tripConnections.get(connectedTripId);

        if (tripConnectionSet) {
          tripConnectionSet.forEach((conn) => {
            if (conn.ws === ws) {
              tripConnectionSet.delete(conn);
            }
          });

          // Remove the trip's entry if no connections left
          if (tripConnectionSet.size === 0) {
            tripConnections.delete(connectedTripId);
          }
        }
      }
    });
  });

  // Function to notify all connected clients for a trip plan
  function notifyTripPlanUpdate(tripId: number, data: any) {
    const tripConnectionSet = tripConnections.get(tripId);

    if (tripConnectionSet) {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });

      tripConnectionSet.forEach(({ ws, userId }) => {
        // Don't send the notification back to the user who made the change
        if (userId !== data.userId && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }
  
  // Function to notify specific user through chat connections
  function notifyChatUser(userId: number, data: any) {
    const userConnections = chatConnections.get(userId);
    
    if (userConnections) {
      const message = JSON.stringify(data);
      
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  return httpServer;
}