import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createCacheKey } from '@/lib/queryClient';
import { PerformanceUtils } from '@/lib/performance-config';

// استخدام التحميل الكسول للمكونات غير الضرورية للعرض الأولي
const OptimizedPropertyCard = React.lazy(() => import('@/components/OptimizedPropertyCard'));
import LazyComponent from '@/components/ui/lazy-component';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Search, Filter, MapPin, X, SlidersHorizontal } from 'lucide-react';

/**
 * صفحة عرض العقارات المحسنة
 * تستخدم تقنيات تحسين الأداء مثل:
 * - التحميل الكسول للمكونات والصور
 * - تجزئة المهام الثقيلة
 * - تقليل إعادة التصيير غير الضروري
 * - ضغط الصور والعرض التكيفي
 */
export default function OptimizedPropertiesPage() {
  // حالة البحث والتصفية
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'price_asc' | 'price_desc' | 'rating' | 'newest'>('newest');
  
  // حالة العرض
  const [loadingStrategy, setLoadingStrategy] = useState<'eager' | 'lazy' | 'progressive'>('progressive');
  
  // استعلام للحصول على بيانات العقارات
  const { data: propertiesData, isLoading, isError } = useQuery({
    queryKey: createCacheKey('/api/properties', { 
      location: selectedLocation,
      search: searchQuery,
      page: currentPage,
      sort: sortOrder
    }),
    // استخدام تأخير إعادة المحاولة للتعامل مع الشبكات البطيئة
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
  
  // تحضير قائمة المواقع المتاحة
  const locations = useMemo(() => [
    { id: 'ras-el-hekma', name: 'رأس الحكمة' },
    { id: 'sharm-el-sheikh', name: 'شرم الشيخ' },
    { id: 'el-sahel', name: 'الساحل الشمالي' },
    { id: 'marina', name: 'مارينا' },
    { id: 'marsa-matrouh', name: 'مرسى مطروح' },
  ], []);
  
  // معالجة تغيير موقع البحث
  const handleLocationChange = useCallback((value: string) => {
    setSelectedLocation(value);
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الموقع
  }, []);
  
  // معالجة تغيير استعلام البحث
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  // معالجة تغيير ترتيب الفرز
  const handleSortChange = useCallback((value: string) => {
    setSortOrder(value as 'price_asc' | 'price_desc' | 'rating' | 'newest');
  }, []);
  
  // مسح البحث
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  // مسح الموقع
  const clearLocation = useCallback(() => {
    setSelectedLocation('');
  }, []);
  
  // الحصول على البيانات المعالجة
  const properties = useMemo(() => {
    if (!propertiesData) return [];
    return propertiesData.properties || propertiesData || [];
  }, [propertiesData]);
  
  // استخدام تقسيم المهام لمعالجة البيانات الكبيرة بفعالية
  const processedProperties = useMemo(() => {
    if (properties.length === 0) return [];
    
    // محاكاة معالجة البيانات (في التطبيق الفعلي، هذا قد يتضمن تحويلات أكثر تعقيدًا)
    return PerformanceUtils.chunkedTask(
      properties,
      (property) => ({
        ...property,
        // يمكن إضافة تحويلات أو معالجة إضافية هنا
      }),
      10 // حجم الدفعة
    );
  }, [properties]);
  
  // تنظيم العقارات في شبكة
  const renderProperties = () => {
    if (isLoading) {
      // عرض هياكل التحميل
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={`skeleton-${idx}`} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (isError) {
      return (
        <Card className="p-6 text-center">
          <CardTitle className="text-xl mb-2">حدث خطأ أثناء تحميل العقارات</CardTitle>
          <CardDescription>
            يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
          </CardDescription>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </Card>
      );
    }
    
    if (properties.length === 0) {
      return (
        <Card className="p-6 text-center">
          <CardTitle className="text-xl mb-2">لا توجد عقارات متاحة</CardTitle>
          <CardDescription>
            حاول البحث باستخدام معايير مختلفة أو تصفح جميع العقارات المتوفرة.
          </CardDescription>
          <Button className="mt-4" onClick={() => {
            setSearchQuery('');
            setSelectedLocation('');
          }}>
            عرض جميع العقارات
          </Button>
        </Card>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <LazyComponent
            key={property.id}
            threshold={300}
            delay={index < 3 ? 0 : 100} // تأخير أقل للعناصر المرئية الأولى
            height={300}
            className="flex flex-col h-full"
          >
            <Suspense fallback={
              <Card className="overflow-hidden h-full">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
              </Card>
            }>
              <OptimizedPropertyCard
                property={property}
                loadingStrategy={loadingStrategy}
                loadingPriority={index < 3 ? 'high' : 'low'}
                showLocation={true}
                showRating={true}
                enableFavorite={true}
              />
            </Suspense>
          </LazyComponent>
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold">العقارات المعروضة</h1>
        <p className="text-muted-foreground">
          تصفح أفضل العقارات في مختلف المواقع المميزة للإيجار أو الشراء
        </p>
      </div>
      
      {/* أدوات البحث والتصفية */}
      <div className="bg-card rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* حقل البحث */}
          <div className="flex-grow">
            <label className="text-sm font-medium mb-1.5 block">بحث</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث باسم العقار أو الوصف..."
                className="pl-9 pr-9"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
          
          {/* اختيار الموقع */}
          <div className="md:w-64">
            <label className="text-sm font-medium mb-1.5 block">الموقع</label>
            <div className="relative">
              <Select
                value={selectedLocation}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="جميع المواقع" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المواقع</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLocation && (
                <button
                  onClick={clearLocation}
                  className="absolute right-9 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
          
          {/* اختيار الترتيب */}
          <div className="md:w-48">
            <label className="text-sm font-medium mb-1.5 block">الترتيب</label>
            <Select
              value={sortOrder}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="الترتيب الافتراضي" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر: من الأقل للأعلى</SelectItem>
                <SelectItem value="price_desc">السعر: من الأعلى للأقل</SelectItem>
                <SelectItem value="rating">التقييم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* زر البحث */}
          <Button className="md:w-28">
            <Filter className="h-4 w-4 mr-2" />
            تصفية
          </Button>
        </div>
        
        {/* اختيار استراتيجية التحميل (للتوضيح فقط) */}
        <Separator className="my-4" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">استراتيجية التحميل:</span>
          <Button
            variant={loadingStrategy === 'eager' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoadingStrategy('eager')}
          >
            فوري
          </Button>
          <Button
            variant={loadingStrategy === 'lazy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoadingStrategy('lazy')}
          >
            كسول
          </Button>
          <Button
            variant={loadingStrategy === 'progressive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoadingStrategy('progressive')}
          >
            تدريجي
          </Button>
        </div>
      </div>
      
      {/* نتائج البحث */}
      <div>
        {renderProperties()}
      </div>
      
      {/* ترقيم الصفحات */}
      {properties.length > 0 && !isLoading && (
        <div className="flex justify-center mt-8">
          <div className="join">
            <Button
              variant="outline"
              className="join-item"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            {[1, 2, 3, 4, 5].map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                className="join-item"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              className="join-item"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === 5 || properties.length < 10}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}