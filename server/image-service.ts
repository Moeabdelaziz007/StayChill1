import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";
import sharp from 'sharp';
import { promisify } from 'util';

// تحويل وظائف fs.mkdir و fs.access إلى وعود (Promises)
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

// تهيئة مجلدات التخزين المؤقت عند بدء التطبيق
export const initializeImageCache = async (): Promise<void> => {
  const cacheDir = path.join(__dirname, '../static/cache/images');
  
  try {
    if (!(await exists(cacheDir))) {
      await mkdir(cacheDir, { recursive: true });
      console.log(`تم إنشاء مجلد التخزين المؤقت للصور في: ${cacheDir}`);
    }
  } catch (error) {
    console.error('خطأ في إنشاء مجلد التخزين المؤقت للصور:', error);
  }
};

// تحديد المسار الحالي بدلاً من استخدام __dirname (لأن هذا ملف ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware للتحقق مما إذا كان الطلب يخص ملف صورة
export const isImageRequest = (req: Request, res: Response, next: NextFunction) => {
  const imagePaths = ['/assets/images/', '/static/images/', '/uploads/images/'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  
  // التحقق من مسار الطلب
  const isImagePath = imagePaths.some(path => req.path.includes(path));
  const hasImageExtension = imageExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
  
  // تحديد ما إذا كان هذا طلبًا للصورة
  if (isImagePath || hasImageExtension) {
    // إضافة خاصية إلى الطلب للإشارة إلى أنه طلب صورة
    (req as any).isImageRequest = true;
    
    // تحديد تنسيق الصورة المطلوب
    const extension = path.extname(req.path).toLowerCase();
    (req as any).imageFormat = extension.slice(1); // إزالة النقطة في بداية الامتداد
    
    // تحديد ما إذا كنا سنحول الصورة إلى WebP
    (req as any).shouldConvertToWebP = shouldConvertToWebP(req, req.path);
  }
  
  next();
};

// إنشاء قائمة الرؤوس المناسبة للصور
export const setImageCacheHeaders = (res: Response, maxAge = 86400): void => {
  // تعيين رؤوس التخزين المؤقت للصور
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
  res.setHeader('Vary', 'Accept, Accept-Encoding');
};

// إنشاء مسار للصورة المحولة
export const getCacheFilePath = (
  originalPath: string,
  format = 'webp',
  width?: number,
  quality?: number
): string => {
  const parsed = path.parse(originalPath);
  const cacheDir = path.join(__dirname, '../static/cache/images');
  
  // إنشاء اسم ملف فريد يتضمن معلمات التحويل
  let filename = parsed.name;
  if (width) filename += `_w${width}`;
  if (quality) filename += `_q${quality}`;
  
  return path.join(cacheDir, `${filename}.${format}`);
};

// تحديد النوع المناسب لمحتوى الصورة بناءً على الامتداد
export const getContentTypeFromExtension = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
};

// التحقق من دعم المتصفح لتنسيق WebP
export const supportsWebP = (req: Request): boolean => {
  const acceptHeader = req.headers.accept || '';
  return acceptHeader.includes('image/webp');
};

// التحقق من دعم المتصفح لتنسيق AVIF
export const supportsAVIF = (req: Request): boolean => {
  const acceptHeader = req.headers.accept || '';
  return acceptHeader.includes('image/avif');
};

// تحديد أفضل تنسيق للصورة بناءً على دعم المتصفح
export const getBestImageFormat = (req: Request): 'avif' | 'webp' | 'original' => {
  if (supportsAVIF(req)) {
    return 'avif';
  } else if (supportsWebP(req)) {
    return 'webp';
  }
  return 'original';
};

// تحديد ما إذا كان يجب تحويل الصورة إلى تنسيق محسن
export const shouldConvertToWebP = (req: Request, filePath: string): boolean => {
  // تحقق مما إذا كان المتصفح يدعم WebP
  const webpSupport = supportsWebP(req);
  
  // تحقق من أن الملف ليس بالفعل بتنسيق WebP أو SVG
  const ext = path.extname(filePath).toLowerCase();
  const isConvertibleFormat = ['.jpg', '.jpeg', '.png'].includes(ext);
  
  // قم بالتحويل فقط إذا كان المتصفح يدعم WebP والملف بتنسيق قابل للتحويل
  return webpSupport && isConvertibleFormat;
};

// التحقق مما إذا كان المتصفح يدعم الضغط
export const supportsCompression = (req: Request): string | null => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('br')) {
    return 'br'; // Brotli
  } else if (acceptEncoding.includes('gzip')) {
    return 'gzip';
  } else if (acceptEncoding.includes('deflate')) {
    return 'deflate';
  }
  
  return null;
};

// وظيفة لتحويل الصورة باستخدام Sharp
const convertAndOptimizeImage = async (
  sourceFilePath: string,
  targetFilePath: string,
  format: 'webp' | 'avif' | 'original',
  width?: number,
  quality?: number
): Promise<boolean> => {
  try {
    // التأكد من وجود مجلد التخزين المؤقت
    const cacheDir = path.dirname(targetFilePath);
    await mkdir(cacheDir, { recursive: true });
    
    // تحديد خيارات التحويل المناسبة
    let sharpInstance = sharp(sourceFilePath);
    
    // تغيير حجم الصورة إذا تم تحديد العرض
    if (width) {
      sharpInstance = sharpInstance.resize(width);
    }
    
    // تطبيق تنسيق الصورة المناسب
    if (format === 'webp') {
      const webpOptions = { quality: quality || 80 };
      await sharpInstance.webp(webpOptions).toFile(targetFilePath);
    } else if (format === 'avif') {
      const avifOptions = { quality: quality || 75 };
      await sharpInstance.avif(avifOptions).toFile(targetFilePath);
    } else {
      // الاحتفاظ بالتنسيق الأصلي مع تطبيق الضغط
      const outputOptions = { quality: quality || 85 };
      const extname = path.extname(sourceFilePath).toLowerCase();
      
      if (extname === '.jpg' || extname === '.jpeg') {
        await sharpInstance.jpeg(outputOptions).toFile(targetFilePath);
      } else if (extname === '.png') {
        await sharpInstance.png({ compressionLevel: 9 }).toFile(targetFilePath);
      } else {
        // للتنسيقات الأخرى، نسخ الملف بدون تعديل
        await sharpInstance.toFile(targetFilePath);
      }
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في تحويل الصورة:', error);
    return false;
  }
};

// Middleware لمعالجة طلبات الصور المحسنة
export const optimizedImageMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // التحقق مما إذا كان هذا طلبًا للصورة
  if (!(req as any).isImageRequest) {
    next();
    return;
  }
  
  try {
    // الحصول على معلمات تحسين الصورة من سلسلة الاستعلام
    const width = req.query.w ? parseInt(req.query.w as string, 10) : undefined;
    const quality = req.query.q ? parseInt(req.query.q as string, 10) : undefined;
    
    // تحديد أفضل تنسيق للصورة بناءً على دعم المتصفح
    const bestFormat = getBestImageFormat(req);
    
    // بناء مسار الملف الأصلي
    let filePath = path.join(__dirname, '..', req.path);
    
    // بناء مسار الملف المخزن مؤقتًا
    const cacheFilePath = getCacheFilePath(filePath, bestFormat === 'original' ? path.extname(filePath).slice(1) : bestFormat, width, quality);
    
    // التحقق من وجود الملف الأصلي
    const originalFileExists = await exists(filePath);
    if (!originalFileExists) {
      // الملف غير موجود، استمر في المعالجة العادية
      next();
      return;
    }
    
    // التحقق مما إذا كان الملف المحسن موجود بالفعل
    const optimizedFileExists = await exists(cacheFilePath);
    if (optimizedFileExists) {
      // إرسال الملف المحسن المخزن مؤقتًا
      const contentType = getContentTypeFromExtension(cacheFilePath);
      res.setHeader('Content-Type', contentType);
      setImageCacheHeaders(res);
      res.sendFile(cacheFilePath);
      return;
    }
    
    // تحويل الصورة وتخزينها
    const conversionSuccess = await convertAndOptimizeImage(
      filePath,
      cacheFilePath,
      bestFormat,
      width,
      quality
    );
    
    if (conversionSuccess && await exists(cacheFilePath)) {
      // إرسال الملف المحسن
      const contentType = getContentTypeFromExtension(cacheFilePath);
      res.setHeader('Content-Type', contentType);
      setImageCacheHeaders(res);
      
      // إرسال الملف المحسن
      res.sendFile(cacheFilePath);
    } else {
      // في حالة فشل التحويل، إرسال الملف الأصلي
      const contentType = getContentTypeFromExtension(filePath);
      res.setHeader('Content-Type', contentType);
      setImageCacheHeaders(res);
      res.sendFile(filePath);
    }
  } catch (error) {
    console.error('خطأ في معالجة طلب الصورة:', error);
    next();
  }
};