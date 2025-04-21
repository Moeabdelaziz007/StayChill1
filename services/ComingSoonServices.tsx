import { ServiceCard, type Service } from "./ServiceCard";

// القائمة المصغرة للخدمات القادمة قريبًا
export function ComingSoonServices() {
  const comingSoonServices: Service[] = [
    {
      id: 101,
      name: "خدمة تنظيف المنازل",
      location: "جميع المواقع",
      description: "خدمة تنظيف احترافية مع عمالة مدربة وأدوات متطورة",
      serviceType: "cleaning",
      priceRange: "$$",
      image: "/images/services/cleaning-service.jpg",
      available: false,
      comingSoon: true,
      featured: true
    },
    {
      id: 102,
      name: "خدمة توصيل المشتريات والطلبات",
      location: "الساحل ورأس الحكمة",
      description: "خدمة توصيل سريعة وآمنة للمشتريات والطلبات",
      serviceType: "delivery",
      priceRange: "$",
      image: "/images/services/delivery-service.jpg",
      available: false,
      comingSoon: true
    },
    {
      id: 103,
      name: "خدمة حجز السيارات",
      location: "جميع المواقع",
      description: "استئجار سيارات فاخرة واقتصادية مع خيارات توصيل",
      serviceType: "car",
      priceRange: "$$$",
      image: "/images/services/car-rental.jpg",
      available: false,
      comingSoon: true,
      featured: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-2xl font-bold">خدمات قادمة قريباً</h2>
        <p className="text-muted-foreground">
          نعمل على إضافة المزيد من الخدمات لتحسين تجربتك
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {comingSoonServices.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}