// مستودع للأنواع المستخدمة في التطبيق

// البيانات الوصفية للصفحات
export interface Metadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
}