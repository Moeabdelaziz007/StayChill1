import React from 'react';
import { Property } from '@shared/schema';

type JsonLdProps = {
  data: Record<string, any>;
};

/**
 * مكون عام لإنشاء بيانات JSON-LD (Schema.org)
 * يساعد هذا المكون على تحسين SEO من خلال إضافة بيانات منظمة للصفحات
 */
const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

/**
 * مكون خاص لإنشاء بيانات JSON-LD لعقارات الإجازات
 */
export const VacationRentalJsonLd: React.FC<{ property: Property }> = ({ 
  property 
}) => {
  // تحويل البيانات إلى تنسيق Schema.org
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    "name": property.title,
    "description": property.description,
    "url": `${window.location.origin}/property/${property.id}`,
    "image": property.images.length > 0 ? property.images[0] : null,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location,
      "addressRegion": property.location,
      "streetAddress": property.address
    },
    "numberOfRooms": property.beds,
    "occupancy": {
      "@type": "QuantitativeValue",
      "value": property.guests
    },
    "amenityFeature": (property.amenities || []).map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    })),
    "priceRange": `$${property.price} per night`,
    "telephone": "+201234567890", // رقم هاتف افتراضي - يمكن تحديثه لاحقًا
    "petsAllowed": property.petFriendly
  };

  return <JsonLd data={schemaData} />;
};

/**
 * مكون خاص لإنشاء بيانات JSON-LD لصفحة قائمة العقارات
 */
export const PropertyListJsonLd: React.FC<{ 
  properties: Property[],
  currentUrl: string 
}> = ({ 
  properties, 
  currentUrl 
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "url": currentUrl,
    "numberOfItems": properties.length,
    "itemListElement": properties.map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "VacationRental",
        "url": `${window.location.origin}/property/${property.id}`,
        "name": property.title,
        "image": property.images.length > 0 ? property.images[0] : null,
        "description": property.description.substring(0, 200) + (property.description.length > 200 ? '...' : ''),
        "priceRange": `$${property.price} per night`
      }
    }))
  };

  return <JsonLd data={schemaData} />;
};

/**
 * مكون خاص لإنشاء بيانات JSON-LD لمؤسسة (عن الشركة)
 */
export const OrganizationJsonLd: React.FC = () => {
  // استخدام useEffect لتجنب أخطاء window undefined عند رندر المكون من جانب الخادم
  const [baseUrl, setBaseUrl] = React.useState("");
  
  React.useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StayChill",
    "url": baseUrl || "https://staychill.com",
    "logo": `${baseUrl || "https://staychill.com"}/logo.png`,
    "sameAs": [
      "https://facebook.com/staychill",
      "https://twitter.com/staychill",
      "https://instagram.com/staychill"
    ],
    "description": "منصة حجز العقارات الرائدة في مصر لقضاء العطلات في أجمل الوجهات الساحلية",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "القاهرة",
      "addressRegion": "القاهرة",
      "addressCountry": "مصر"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+201234567890",
      "contactType": "customer service",
      "availableLanguage": ["Arabic", "English"]
    }
  };

  return <JsonLd data={schemaData} />;
};

/**
 * مكون خاص لإنشاء بيانات JSON-LD للفتات المستخدم
 */
export const BreadcrumbJsonLd: React.FC<{
  items: Array<{ name: string; url: string }>
}> = ({ items }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return <JsonLd data={schemaData} />;
};

export default JsonLd;