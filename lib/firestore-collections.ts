import { getFirestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, DocumentData, QueryConstraint } from 'firebase/firestore';
import { auth } from './firebase';

// إنشاء مثيل Firestore
const db = getFirestore();

// تعريف أسماء المجموعات
export const COLLECTIONS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  USER_PREFERENCES: 'user_preferences',
  RESTAURANTS: 'restaurants',
  RESTAURANT_BOOKINGS: 'restaurant_bookings',
  SERVICES: 'services',
  SERVICE_BOOKINGS: 'service_bookings',
};

/**
 * وظيفة مساعدة للتخلص من الهياكل الدائرية عند التعامل مع بيانات Firestore
 * @param obj الكائن المراد تخليصه من الهياكل الدائرية
 * @returns نسخة آمنة من الكائن بدون هياكل دائرية
 */
export function sanitizeFirestoreData(obj: any): any {
  const seen = new Set();
  
  function sanitizeValue(obj: any, path = ''): any {
    // معالجة القيم البسيطة
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    
    // تجنب الهياكل الدائرية
    const currentPath = path ? `${path}.${obj.constructor.name}` : obj.constructor.name;
    if (seen.has(obj)) return `[Circular:${currentPath}]`;
    seen.add(obj);
    
    // معالجة المصفوفات
    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeValue(item, `${currentPath}[${index}]`));
    }
    
    // معالجة التواريخ
    if (obj instanceof Date) {
      return obj;
    }
    
    // معالجة الكائنات العادية
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // تجاهل الخصائص الخاصة وغير الضرورية
        if (key.startsWith('_') || key.startsWith('$') || typeof obj[key] === 'function') {
          continue;
        }
        result[key] = sanitizeValue(obj[key], `${currentPath}.${key}`);
      }
    }
    return result;
  }
  
  return sanitizeValue(obj);
}

// ====== وظائف إدارة المستخدمين ======

/**
 * إنشاء أو تحديث مستخدم في Firestore
 */
export async function setUser(userId: string, userData: any) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(userData);
  return setDoc(userRef, {
    ...safeData,
    updatedAt: new Date()
  }, { merge: true });
}

/**
 * الحصول على مستخدم من Firestore باستخدام المعرف
 */
export async function getUser(userId: string) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnapshot = await getDoc(userRef);
  return userSnapshot.exists() ? userSnapshot.data() : null;
}

/**
 * البحث عن مستخدم بواسطة البريد الإلكتروني
 */
export async function getUserByEmail(email: string) {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  const userData = querySnapshot.docs[0].data();
  return {
    id: querySnapshot.docs[0].id,
    ...userData
  };
}

// ====== وظائف إدارة العقارات ======

/**
 * إنشاء عقار جديد في Firestore
 */
export async function createProperty(propertyData: any) {
  const propertiesRef = collection(db, COLLECTIONS.PROPERTIES);
  const newPropertyRef = doc(propertiesRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(propertyData);
  
  await setDoc(newPropertyRef, {
    ...safeData,
    id: newPropertyRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newPropertyRef.id;
}

/**
 * الحصول على عقار من Firestore باستخدام المعرف
 */
export async function getProperty(propertyId: string) {
  const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  return propertySnapshot.exists() ? propertySnapshot.data() : null;
}

/**
 * الحصول على جميع العقارات المملوكة لمستخدم معين
 */
export async function getUserProperties(userId: string) {
  const propertiesRef = collection(db, COLLECTIONS.PROPERTIES);
  const q = query(propertiesRef, where("ownerId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * الحصول على العقارات المميزة
 */
export async function getFeaturedProperties(maxResults = 6) {
  const propertiesRef = collection(db, COLLECTIONS.PROPERTIES);
  const q = query(propertiesRef, 
    where("isFeatured", "==", true), 
    orderBy("createdAt", "desc"), 
    limit(maxResults)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ====== وظائف إدارة الحجوزات ======

/**
 * إنشاء حجز جديد في Firestore
 */
export async function createBooking(bookingData: any) {
  const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
  const newBookingRef = doc(bookingsRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(bookingData);
  
  await setDoc(newBookingRef, {
    ...safeData,
    id: newBookingRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newBookingRef.id;
}

/**
 * الحصول على حجوزات المستخدم
 */
export async function getUserBookings(userId: string) {
  const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
  const q = query(bookingsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * الحصول على حجوزات عقار معين
 */
export async function getPropertyBookings(propertyId: string) {
  const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
  const q = query(bookingsRef, where("propertyId", "==", propertyId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ====== وظائف إدارة التقييمات ======

/**
 * إنشاء تقييم جديد في Firestore
 */
export async function createReview(reviewData: any) {
  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const newReviewRef = doc(reviewsRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(reviewData);
  
  await setDoc(newReviewRef, {
    ...safeData,
    id: newReviewRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newReviewRef.id;
}

/**
 * الحصول على تقييمات عقار معين
 */
export async function getPropertyReviews(propertyId: string) {
  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const q = query(reviewsRef, where("propertyId", "==", propertyId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ====== وظائف إدارة المطاعم ======

/**
 * إنشاء مطعم جديد في Firestore
 */
export async function createRestaurant(restaurantData: any) {
  const restaurantsRef = collection(db, COLLECTIONS.RESTAURANTS);
  const newRestaurantRef = doc(restaurantsRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(restaurantData);
  
  await setDoc(newRestaurantRef, {
    ...safeData,
    id: newRestaurantRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newRestaurantRef.id;
}

/**
 * الحصول على مطعم من Firestore باستخدام المعرف
 */
export async function getRestaurant(restaurantId: string) {
  const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
  const restaurantSnapshot = await getDoc(restaurantRef);
  return restaurantSnapshot.exists() ? restaurantSnapshot.data() : null;
}

/**
 * الحصول على المطاعم المميزة
 */
export async function getFeaturedRestaurants(maxResults = 6) {
  const restaurantsRef = collection(db, COLLECTIONS.RESTAURANTS);
  const q = query(restaurantsRef, 
    where("isFeatured", "==", true), 
    orderBy("createdAt", "desc"), 
    limit(maxResults)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * إنشاء حجز مطعم جديد في Firestore
 */
export async function createRestaurantBooking(bookingData: any) {
  const bookingsRef = collection(db, COLLECTIONS.RESTAURANT_BOOKINGS);
  const newBookingRef = doc(bookingsRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(bookingData);
  
  await setDoc(newBookingRef, {
    ...safeData,
    id: newBookingRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newBookingRef.id;
}

// ====== وظائف إدارة الخدمات ======

/**
 * إنشاء خدمة جديدة في Firestore
 */
export async function createService(serviceData: any) {
  const servicesRef = collection(db, COLLECTIONS.SERVICES);
  const newServiceRef = doc(servicesRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(serviceData);
  
  await setDoc(newServiceRef, {
    ...safeData,
    id: newServiceRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newServiceRef.id;
}

/**
 * الحصول على خدمة من Firestore باستخدام المعرف
 */
export async function getService(serviceId: string) {
  const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
  const serviceSnapshot = await getDoc(serviceRef);
  return serviceSnapshot.exists() ? serviceSnapshot.data() : null;
}

/**
 * إنشاء حجز خدمة جديد في Firestore
 */
export async function createServiceBooking(bookingData: any) {
  const bookingsRef = collection(db, COLLECTIONS.SERVICE_BOOKINGS);
  const newBookingRef = doc(bookingsRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(bookingData);
  
  await setDoc(newBookingRef, {
    ...safeData,
    id: newBookingRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return newBookingRef.id;
}

// ====== وظائف إدارة الإشعارات ======

/**
 * إنشاء إشعار جديد في Firestore
 */
export async function createNotification(userId: string, notificationData: any) {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const newNotificationRef = doc(notificationsRef);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(notificationData);
  
  await setDoc(newNotificationRef, {
    ...safeData,
    id: newNotificationRef.id,
    userId,
    isRead: false,
    createdAt: new Date()
  });
  
  return newNotificationRef.id;
}

/**
 * الحصول على إشعارات المستخدم
 */
export async function getUserNotifications(userId: string, includeRead = false) {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  ];
  
  if (!includeRead) {
    constraints.push(where("isRead", "==", false));
  }
  
  const q = query(notificationsRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * وضع علامة على إشعار كمقروء
 */
export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  return updateDoc(notificationRef, {
    isRead: true,
    readAt: new Date()
  });
}

/**
 * وضع علامة على جميع إشعارات المستخدم كمقروءة
 */
export async function markAllNotificationsAsRead(userId: string) {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(notificationsRef, 
    where("userId", "==", userId),
    where("isRead", "==", false)
  );
  const querySnapshot = await getDocs(q);
  
  const batch = [];
  for (const doc of querySnapshot.docs) {
    batch.push(updateDoc(doc.ref, {
      isRead: true,
      readAt: new Date()
    }));
  }
  
  await Promise.all(batch);
  return querySnapshot.size; // عدد الإشعارات التي تم وضع علامة عليها
}

// ====== وظائف تفضيلات المستخدم ======

/**
 * تحديث تفضيلات المستخدم
 */
export async function updateUserPreferences(userId: string, preferences: any) {
  const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
  // تنقية البيانات من الهياكل الدائرية
  const safeData = sanitizeFirestoreData(preferences);
  
  return setDoc(preferencesRef, {
    ...safeData,
    updatedAt: new Date()
  }, { merge: true });
}

/**
 * الحصول على تفضيلات المستخدم
 */
export async function getUserPreferences(userId: string) {
  const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
  const preferencesSnapshot = await getDoc(preferencesRef);
  return preferencesSnapshot.exists() ? preferencesSnapshot.data() : null;
}

// تصدير مثيل Firestore للاستخدام في أماكن أخرى
export { db };