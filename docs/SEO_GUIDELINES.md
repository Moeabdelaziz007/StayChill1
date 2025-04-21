# دليل تحسين قابلية الاكتشاف (SEO) - StayChill

## التكوين الأساسي

تم إنشاء تكوين موحد لـ SEO لضمان اتساق العناوين والأوصاف الوصفية عبر التطبيق بأكمله.

```javascript
// إعدادات عامة لمحركات البحث
export const SEOConfig = {
  baseTitle: "StayChill | منصة حجز العقارات الرائدة في مصر",
  metaDescription: "احجز أفضل العقارات في الساحل، رأس الحكمة، مرسى مطروح، شرم الشيخ ومارينا. استمتع بعطلتك في أجمل الأماكن المصرية مع خدمات إضافية مميزة.",
  dynamicMeta: (pageData) => ({
    title: `${pageData.title} | StayChill`,
    image: pageData.thumbnail
  })
};
```

## مكونات تحسين SEO

### 1. MetaTags

مكون لإدارة علامات التعريف الوصفية لكل صفحة.

```tsx
interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  noIndex?: boolean;
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = SEOConfig.baseTitle,
  description = SEOConfig.metaDescription,
  image,
  url = window.location.href,
  type = 'website',
  locale = 'ar-EG',
  noIndex = false,
}) => {
  // تحديث عنوان الصفحة
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <Helmet>
      {/* علامات Meta الأساسية */}
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* علامات Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      {image && <meta property="og:image" content={image} />}
      
      {/* علامات Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* علامات تعريف الموقع */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default MetaTags;
```

### 2. StructuredData

مكون لإضافة البيانات المنظمة بتنسيق Schema.org لتحسين ظهور Rich Snippets.

```tsx
interface StructuredDataProps {
  type: 'Property' | 'Restaurant' | 'Organization' | 'WebPage' | 'BreadcrumbList';
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generatePropertySchema = (property: any) => ({
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: property.title,
    description: property.description,
    image: property.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressRegion: property.region,
      addressCountry: 'EG'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude
    },
    priceRange: `${property.price} EGP`,
    amenityFeature: property.features?.map((feature: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: feature
    }))
  });

  const generateRestaurantSchema = (restaurant: any) => ({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: restaurant.location,
      addressRegion: restaurant.region,
      addressCountry: 'EG'
    },
    servesCuisine: restaurant.cuisineType,
    priceRange: '$'.repeat(restaurant.priceLevel),
    telephone: restaurant.phone,
  });

  const generateOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StayChill',
    url: 'https://staychill.com',
    logo: 'https://staychill.com/logo.png',
    sameAs: [
      'https://www.facebook.com/staychill',
      'https://www.instagram.com/staychill',
      'https://twitter.com/staychill'
    ]
  });

  const schemaMap = {
    'Property': generatePropertySchema,
    'Restaurant': generateRestaurantSchema,
    'Organization': generateOrganizationSchema,
    // إضافة أنواع أخرى حسب الحاجة
  };

  const schemaGenerator = schemaMap[type as keyof typeof schemaMap];
  const schemaData = schemaGenerator ? schemaGenerator(data) : data;

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

export default StructuredData;
```

### 3. BreadcrumbNav

مكون للتنقل التفصيلي الذي يحسن قابلية الاستخدام وقابلية الاكتشاف.

```tsx
interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className }) => {
  // إنشاء بيانات منظمة للتنقل التفصيلي
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${window.location.origin}${item.href}`
    }))
  };

  return (
    <>
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <nav aria-label="التنقل التفصيلي" className={cn("flex items-center text-sm text-muted-foreground", className)}>
        <ol className="flex items-center space-x-1 space-x-reverse">
          {items.map((item, i) => (
            <li key={i} className="flex items-center">
              {i > 0 && <ChevronLeft className="h-4 w-4 mx-1" />}
              <Link
                to={item.href}
                className={cn(
                  "hover:text-foreground transition-colors",
                  i === items.length - 1 ? "font-medium text-foreground" : ""
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default BreadcrumbNav;
```

## استراتيجيات تحسين SEO

### 1. تحسين العناوين والأوصاف

```tsx
// استخدام مكون MetaTags في صفحات التطبيق
function PropertyPage() {
  const { id } = useParams();
  const { data: property, isLoading } = useQuery({
    queryKey: ['/api/properties', id],
  });
  
  if (isLoading) return <PropertySkeleton />;
  
  return (
    <>
      <MetaTags
        title={`${property.title} في ${property.location} | StayChill`}
        description={`${property.description.substring(0, 160)}...`}
        image={property.image}
        type="product"
      />
      
      <StructuredData type="Property" data={property} />
      
      <BreadcrumbNav
        items={[
          { label: "الرئيسية", href: "/" },
          { label: property.location, href: `/location/${encodeURIComponent(property.location)}` },
          { label: property.title, href: `/property/${id}` }
        ]}
      />
      
      {/* محتوى الصفحة */}
    </>
  );
}
```

### 2. تحسين الصور

```tsx
// مكون لتحسين الصور لـ SEO
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
      onError={(e) => {
        e.currentTarget.src = placeholder || '/images/placeholder.jpg';
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
```

### 3. تحسين URL

```typescript
// وظيفة لإنشاء URL صديقة لـ SEO
export const createSeoFriendlyUrl = (text: string): string => {
  // تحويل النص العربي إلى يونيكود بدون تشكيل
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // استبدال الأحرف غير المسموح بها في URL
  const slug = normalized
    .toLowerCase()
    .replace(/\s+/g, '-')       // استبدال المسافات بشرطات
    .replace(/[^\w\-]+/g, '')   // إزالة الأحرف الخاصة
    .replace(/\-\-+/g, '-')     // استبدال الشرطات المتعددة بشرطة واحدة
    .replace(/^-+/, '')         // إزالة الشرطات من البداية
    .replace(/-+$/, '');        // إزالة الشرطات من النهاية
  
  return slug;
};

// استخدام الوظيفة في بناء الروابط
<Link to={`/property/${property.id}/${createSeoFriendlyUrl(property.title)}`}>
  {property.title}
</Link>
```

### 4. تحسين السرعة وتجربة المستخدم

```typescript
// مؤشرات الأداء الحيوية
export const measureCoreWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // قياس وقت تحميل الصفحة (LCP - Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lcpEntry = entries[entries.length - 1];
      console.log('LCP:', lcpEntry.startTime / 1000, 'seconds');
      
      // إرسال بيانات الأداء إلى التحليلات
      logPerformanceMetric('LCP', lcpEntry.startTime);
    });
    
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // قياس تأخر الاستجابة (FID - First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      const fidEntry = entryList.getEntries()[0];
      console.log('FID:', fidEntry.processingStart - fidEntry.startTime, 'ms');
      
      logPerformanceMetric('FID', fidEntry.processingStart - fidEntry.startTime);
    });
    
    fidObserver.observe({ type: 'first-input', buffered: true });
    
    // قياس تحول التخطيط التراكمي (CLS - Cumulative Layout Shift)
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      console.log('CLS:', clsValue);
      logPerformanceMetric('CLS', clsValue);
    });
    
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  }
};

// استدعاء القياس عند تحميل التطبيق
useEffect(() => {
  measureCoreWebVitals();
}, []);
```

## خريطة الموقع وملف Robots.txt

### خريطة الموقع (sitemap.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://staychill.com/</loc>
    <lastmod>2023-05-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://staychill.com/properties</loc>
    <lastmod>2023-05-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://staychill.com/restaurants</loc>
    <lastmod>2023-05-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- يمكن إضافة الصفحات الديناميكية مثل صفحات العقارات المختلفة -->
</urlset>
```

### ملف Robots.txt

```
User-agent: *
Allow: /

# منع الوصول إلى صفحات الإدارة
Disallow: /admin/
Disallow: /dashboard/

# منع الوصول إلى صفحات المستخدم الشخصية
Disallow: /profile/

# منع الوصول إلى الصفحات التي تتطلب مصادقة
Disallow: /auth/
Disallow: /checkout/
Disallow: /my-bookings/

# السماح بالوصول إلى ملفات CSS و JavaScript والصور
Allow: /static/
Allow: /images/
Allow: /assets/

# خريطة الموقع
Sitemap: https://staychill.com/sitemap.xml
```

## تحسين SEO للمناطق المحلية

### 1. تحسين الكلمات المفتاحية المحلية

```typescript
// تكوين الكلمات المفتاحية للمناطق المختلفة
export const locationSeoConfig = {
  'رأس الحكمة': {
    title: 'حجز شاليهات وفيلات في رأس الحكمة | StayChill',
    description: 'استمتع بأجمل العطلات في رأس الحكمة واحجز شاليهات وفيلات مطلة على البحر بأفضل الأسعار. خيارات واسعة من الإقامات الفاخرة والاقتصادية.',
    keywords: ['شاليهات رأس الحكمة', 'فيلات رأس الحكمة', 'حجز شاليه رأس الحكمة', 'إيجار فيلا رأس الحكمة'],
    image: '/images/locations/ras-el-hekma.jpg'
  },
  'الساحل الشمالي': {
    title: 'حجز شاليهات وفيلات في الساحل الشمالي | StayChill',
    description: 'احجز أفضل الشاليهات والفيلات في الساحل الشمالي مع StayChill. إقامات فاخرة بأسعار تنافسية في كل مناطق الساحل من مارينا إلى سيدي عبد الرحمن.',
    keywords: ['شاليهات الساحل الشمالي', 'فيلات الساحل', 'حجز شاليه الساحل', 'إيجار فيلا الساحل الشمالي'],
    image: '/images/locations/north-coast.jpg'
  },
  // إضافة مناطق أخرى
};

// استخدام التكوين في صفحات المناطق
function LocationPage() {
  const { location } = useParams();
  const seoConfig = locationSeoConfig[location] || {
    title: `حجز عقارات في ${location} | StayChill`,
    description: `استكشف أفضل خيارات الإقامة في ${location} مع StayChill. احجز شاليهات وفيلات وشقق بأفضل الأسعار.`,
    keywords: [`عقارات ${location}`, `حجز شاليه ${location}`, `إيجار فيلا ${location}`],
    image: '/images/locations/default.jpg'
  };
  
  return (
    <>
      <MetaTags
        title={seoConfig.title}
        description={seoConfig.description}
        image={seoConfig.image}
      />
      
      <div className="mb-4">
        <h1 className="text-3xl font-bold">حجز عقارات في {location}</h1>
        <p className="text-muted-foreground mt-2">{seoConfig.description}</p>
      </div>
      
      {/* محتوى الصفحة */}
    </>
  );
}
```

### 2. صفحات مخصصة للمناطق الشائعة

لكل منطقة رئيسية، يجب إنشاء صفحة مخصصة مع:
- عنوان وصورة فريدة للمنطقة
- وصف مفصل للمنطقة والمعالم القريبة
- قائمة بأفضل العقارات في المنطقة
- معلومات عن الخدمات المتاحة في المنطقة
- خريطة تفاعلية للموقع
- شهادات من العملاء السابقين في هذه المنطقة

## قياس أداء SEO

### 1. ربط التطبيق بـ Google Search Console

- إضافة علامة التحقق من ملكية الموقع:
```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```

### 2. متابعة تقارير الأداء

- تتبع الكلمات المفتاحية التي تجلب زيارات
- مراقبة معدلات النقر (CTR)
- متابعة تصنيف الصفحات في نتائج البحث
- تحليل أخطاء الزحف وتحسينها

### 3. تحسين المحتوى بناءً على البيانات

- تحديث المحتوى للكلمات المفتاحية ذات الأداء الجيد
- إنشاء محتوى جديد يستهدف فرص الكلمات المفتاحية
- تحسين الصفحات ذات معدلات الارتداد العالية

## أفضل الممارسات لـ SEO

1. **سرعة التحميل**:
   - استخدام التحميل الكسول للصور
   - تقليل حجم ملفات CSS وJavaScript
   - استخدام التخزين المؤقت بشكل فعال

2. **تجربة المستخدم على الجوال**:
   - ضمان سهولة التنقل على الأجهزة المحمولة
   - تجنب النوافذ المنبثقة التي تعيق التصفح
   - استخدام أزرار كبيرة بما يكفي للمس

3. **المحتوى**:
   - إنشاء محتوى فريد وعالي الجودة
   - استخدام الكلمات المفتاحية بشكل طبيعي
   - تحديث المحتوى بانتظام

4. **ربط داخلي**:
   - إنشاء بنية ربط منطقية بين الصفحات
   - استخدام نصوص روابط وصفية
   - ضمان إمكانية الوصول إلى جميع الصفحات في ثلاث نقرات أو أقل

5. **بيانات منظمة**:
   - استخدام تنسيق Schema.org لجميع المحتوى المهم
   - الاهتمام بالمراجعات والتقييمات لتحسين النجوم في نتائج البحث
   - إضافة معلومات عن الأسعار والتوفر في البيانات المنظمة