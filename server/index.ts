import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import compression from "compression";
import cors from "cors";
import { isImageRequest, optimizedImageMiddleware, initializeImageCache } from "./image-service";
import { cdnMiddleware, cdnCacheMiddleware } from "./cdn-service";
import { apiCacheMiddleware } from "./api-cache";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// تحديد المسار الحالي بدلاً من استخدام __dirname (لأن هذا ملف ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إنشاء مجلد الكاش للصور المحولة إذا لم يكن موجودًا
const cacheDir = path.join(__dirname, '../static/cache/images');
try {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log('Created image cache directory:', cacheDir);
  }
} catch (err) {
  console.warn('Failed to create image cache directory:', err);
}

// تهيئة Express مع ضغط GZIP/Brotli للملفات
const app = express();

// إضافة دعم CORS لحل مشاكل الاتصال
app.use(cors({
  origin: true, // السماح لجميع المصادر في بيئة التطوير
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true // السماح بإرسال ملفات تعريف الارتباط
}));

// إضافة middleware لضغط ردود الخادم
app.use(compression({
  // مستوى ضغط من 0 (لا ضغط) إلى 9 (أقصى ضغط)
  level: 6, 
  // الحد الأدنى لحجم الردود المراد ضغطها (1KB)
  threshold: 1024,
  // أنواع المحتوى التي سيتم ضغطها
  filter: (req, res) => {
    // دائمًا اضغط محتوى JavaScript, CSS, HTML, JSON, XML, SVG
    if (req.headers['content-type']) {
      if (
        req.headers['content-type'].includes('javascript') ||
        req.headers['content-type'].includes('text/css') ||
        req.headers['content-type'].includes('text/html') ||
        req.headers['content-type'].includes('application/json') ||
        req.headers['content-type'].includes('application/xml') ||
        req.headers['content-type'].includes('image/svg+xml')
      ) {
        return true;
      }
    }
    
    // إذا كان مسار الطلب لملفات JS/CSS/HTML
    if (req.path) {
      if (
        req.path.endsWith('.js') || 
        req.path.endsWith('.css') || 
        req.path.endsWith('.html') || 
        req.path.endsWith('.json') || 
        req.path.endsWith('.xml') || 
        req.path.endsWith('.svg')
      ) {
        return true;
      }
    }
    
    // استخدم الفلتر الافتراضي لباقي أنواع المحتوى
    return compression.filter(req, res);
  }
}));

// إضافة معالجات خاصة بالصور لتحسينها
app.use(isImageRequest); // تحديد طلبات الصور
app.use(optimizedImageMiddleware); // تطبيق تحسينات الصور

// إضافة دعم شبكة توصيل المحتوى (CDN)
app.use(cdnMiddleware); // تعديل الروابط لاستخدام CDN
app.use(cdnCacheMiddleware); // إعادة توجيه طلبات الملفات الثابتة إلى CDN

// إضافة تخزين مؤقت للملفات الثابتة
app.use('/static', (req, res, next) => {
  // تعيين رؤوس التخزين المؤقت لملفات الأصول الثابتة (static assets)
  const maxAge = 86400 * 30; // 30 يومًا
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
  res.setHeader('Vary', 'Accept-Encoding');
  
  next();
});

// إضافة تخزين مؤقت للصور
app.use('/assets', (req, res, next) => {
  // تعيين رؤوس التخزين المؤقت للصور
  const maxAge = 86400 * 30; // 30 يومًا
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
  res.setHeader('Vary', 'Accept, Accept-Encoding');
  
  next();
});

// تهيئة معالجات Express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// تطبيق التخزين المؤقت على API لتحسين الأداء
app.use('/api', apiCacheMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed database with initial data
  try {
    await seedDatabase();
    console.log('Database seeding complete');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
