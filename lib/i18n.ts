import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';

// تعريف اللغات المدعومة
export type Locale = 'ar' | 'en';

// سياق للغة التطبيق
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const defaultContextValue: LocaleContextType = {
  locale: 'ar',
  setLocale: () => {},
  t: (key) => key,
};

export const LocaleContext = createContext<LocaleContextType>(defaultContextValue);

// ترجمات التطبيق
export const translations: Record<Locale, Record<string, string>> = {
  ar: {
    // ترجمات ميزات الذكاء الاصطناعي
    'ai.recommendations.title': 'توصيات ذكية للعقارات',
    'ai.recommendations.subtitle': 'عقارات مختارة لتناسب تفضيلاتك بواسطة الذكاء الاصطناعي',
    'ai.recommendations.tabs.forYou': 'مخصص لك',
    'ai.recommendations.tabs.bestValue': 'أفضل قيمة',
    'ai.recommendations.tabs.trending': 'الأكثر رواجاً',
    'ai.recommendations.match': 'تطابق',
    'ai.recommendations.whyBook': 'لماذا ستحب هذا العقار',
    'ai.recommendations.showMore': 'عرض المزيد من الأسباب',
    'ai.recommendations.showLess': 'عرض أقل',
    'ai.recommendations.refresh': 'تحديث التوصيات',
    'ai.recommendations.error': 'لم نتمكن من إنشاء توصيات في الوقت الحالي',
    'ai.recommendations.errorTitle': 'التوصيات غير متاحة',
    'ai.recommendations.tryAgain': 'حاول مرة أخرى',
    'ai.recommendations.noResultsTitle': 'لم يتم العثور على توصيات',
    'ai.recommendations.noResultsDesc': 'حاول تعديل تفضيلاتك للحصول على تطابقات أفضل',
    'ai.recommendations.resetPreferences': 'إعادة ضبط التفضيلات',
    
    'ai.virtualTour.title': 'جولة افتراضية معززة',
    'ai.virtualTour.subtitle': 'استكشف هذا العقار مع أوصاف مدعومة بالذكاء الاصطناعي',
    'ai.virtualTour.tabs.highlights': 'المميزات',
    'ai.virtualTour.tabs.rooms': 'الغرف',
    'ai.virtualTour.tabs.surroundings': 'المحيط',
    'ai.virtualTour.tabs.experiences': 'التجارب',
    'ai.virtualTour.surroundingsTitle': 'المنطقة المحيطة',
    'ai.virtualTour.experience': 'تجربة',
    'ai.virtualTour.aiGenerated': 'تم إنشاؤه بالذكاء الاصطناعي',
    'ai.virtualTour.regenerate': 'إعادة الإنشاء',
    'ai.virtualTour.error': 'غير قادر على تحميل بيانات الجولة الافتراضية',
    'ai.virtualTour.errorTitle': 'الجولة الافتراضية غير متاحة',
    'ai.virtualTour.tryAgain': 'حاول مرة أخرى',
    'ai.virtualTour.noDataTitle': 'لا توجد جولة افتراضية متاحة',
    'ai.virtualTour.noDataDesc': 'قم بإنشاء جولة افتراضية معززة لهذا العقار',
    'ai.virtualTour.generate': 'إنشاء جولة افتراضية',
    
    'ai.analytics.title': 'تحليل سلوك العملاء',
    'ai.analytics.subtitle': 'رؤى مدعومة بالذكاء الاصطناعي حول تفضيلات وأنماط العملاء',
    'ai.analytics.tabs.segments': 'شرائح العملاء',
    'ai.analytics.tabs.reviews': 'تحليل التقييمات',
    'ai.analytics.sentimentBreakdown': 'تحليل المشاعر',
    'ai.analytics.positive': 'إيجابي',
    'ai.analytics.neutral': 'محايد',
    'ai.analytics.negative': 'سلبي',
    'ai.analytics.topPraises': 'أهم الإشادات',
    'ai.analytics.topComplaints': 'أهم الشكاوى',
    'ai.analytics.trendsOverTime': 'الاتجاهات عبر الزمن',
    'ai.analytics.actionableInsights': 'رؤى قابلة للتنفيذ',
    'ai.analytics.keyInsights': 'رؤى أساسية',
    'ai.analytics.customerSegments': 'شرائح العملاء',
    'ai.analytics.users': 'مستخدمين',
    'ai.analytics.targetingStrategies': 'استراتيجيات الاستهداف',
    'ai.analytics.showLess': 'عرض أقل',
    'ai.analytics.showAll': 'عرض الكل',
    'ai.analytics.viewCustomers': 'عرض العملاء',
    'ai.analytics.scheduleEmail': 'جدولة بريد إلكتروني',
    'ai.analytics.aiGenerated': 'تم إنشاؤه بالذكاء الاصطناعي',
    'ai.analytics.refreshData': 'تحديث البيانات',
    'ai.analytics.errorTitle': 'التحليل غير متاح',
    'ai.analytics.errorReviews': 'غير قادر على تحميل تحليل التقييمات',
    'ai.analytics.errorSegments': 'غير قادر على تحميل شرائح العملاء',
    'ai.analytics.tryAgain': 'حاول مرة أخرى',
    
    'ai.areaGuide.title': 'دليل المنطقة المخصص',
    'ai.areaGuide.subtitle': 'توصيات محلية مصممة خصيصًا لاهتماماتك',
    'ai.areaGuide.tabs.overview': 'نظرة عامة',
    'ai.areaGuide.tabs.overviewShort': 'عام',
    'ai.areaGuide.tabs.attractions': 'معالم',
    'ai.areaGuide.tabs.attractionsShort': 'شاهد',
    'ai.areaGuide.tabs.dining': 'مطاعم',
    'ai.areaGuide.tabs.diningShort': 'تناول',
    'ai.areaGuide.tabs.tips': 'نصائح مميزة',
    'ai.areaGuide.tabs.tipsShort': 'نصائح',
    'ai.areaGuide.topAttractions': 'أهم المعالم',
    'ai.areaGuide.topDining': 'أفضل المطاعم',
    'ai.areaGuide.transportationTips': 'نصائح المواصلات',
    'ai.areaGuide.insiderTips': 'نصائح داخلية',
    'ai.areaGuide.viewOnMap': 'عرض على الخريطة',
    'ai.areaGuide.viewMenu': 'عرض القائمة',
    'ai.areaGuide.aiGenerated': 'تم إنشاؤه بالذكاء الاصطناعي',
    'ai.areaGuide.personalize': 'تخصيص',
    'ai.areaGuide.error': 'غير قادر على تحميل دليل المنطقة',
    'ai.areaGuide.errorTitle': 'دليل المنطقة غير متاح',
    'ai.areaGuide.tryAgain': 'حاول مرة أخرى',
    'ai.areaGuide.noDataTitle': 'لا يوجد دليل منطقة متاح',
    'ai.areaGuide.noDataDesc': 'قم بإنشاء دليل مخصص لهذه المنطقة',
    'ai.areaGuide.generate': 'إنشاء دليل المنطقة',
    
    // ترجمات العقارات
    'property.viewDetails': 'عرض التفاصيل',
    'property.featured': 'عقار مميز',
    'property.discount': 'خصم {percent}%',
    'property.bedrooms': 'غرفة نوم',
    'property.bathrooms': 'حمام',
    'property.guests': 'شخص',
    'property.amenities': 'المرافق',
    'property.locationTitle': 'الموقع',
    'property.pricePerNight': 'الليلة',
    'property.availableDates': 'التواريخ المتاحة',
    'property.book': 'احجز الآن',
    'property.contact': 'تواصل مع المالك',
    'property.reviews': 'تقييمات',
    'property.writeReview': 'اكتب تقييم',
    'property.nearbyAttractions': 'أماكن قريبة',
    'property.nearbyRestaurants': 'مطاعم قريبة',
    'property.similarProperties': 'عقارات مشابهة',
    'property.showAllPhotos': 'عرض كل الصور',
    'property.rentedDates': 'تواريخ مؤجرة',
    'property.startDate': 'تاريخ البداية',
    'property.endDate': 'تاريخ النهاية',
    
    // ترجمات إمكانية الوصول
    'accessibility.skipToContent': 'انتقل إلى المحتوى',
    'accessibility.screenReaderOnly': 'محتوى لقارئات الشاشة فقط',
    'accessibility.reducedMotion': 'تقليل الحركة',
    'accessibility.highContrast': 'تباين عالي',
    'accessibility.darkMode': 'الوضع الداكن',
    'accessibility.increaseText': 'تكبير النص',
    'accessibility.decreaseText': 'تصغير النص',
    'accessibility.resetText': 'إعادة ضبط حجم النص',
    'accessibility.controls': 'إعدادات إمكانية الوصول',
    'accessibility.textSize': 'حجم النص',
    
    // ترجمات نظام المكافآت
    'rewards.rewardsPageTitle': 'نقاط تشيل',
    'rewards.pageTitle': 'مكافآت تشيل',
    'rewards.pageDescription': 'تتبع نقاطك والمزايا الحصرية وتاريخ المعاملات',
    'rewards.yourPoints': 'نقاط تشيل الخاصة بك',
    'rewards.pointsDescription': 'استخدم نقاطك للحصول على خصومات حصرية وترقيات',
    'rewards.pointsTooltip': 'تحصل على نقطتين مقابل كل 1$ تنفقه على الحجوزات',
    'rewards.pointsWorth': 'قيمة نقدية: ${amount}$',
    'rewards.currentPoints': '{points} نقطة',
    'rewards.nextTierPoints': '{tier} ({points} نقطة)',
    'rewards.chillPoints': 'نقاط تشيل',
    'rewards.availablePoints': 'النقاط المتاحة',
    'rewards.currentTier': 'المستوى الحالي',
    'rewards.nextTier': 'المستوى التالي',
    'rewards.toNextTier': 'نحو المستوى التالي',
    'rewards.expiringPoints': '{count} نقطة ستنتهي صلاحيتها قريبًا',
    'rewards.firstExpiryDate': 'أول مجموعة ستنتهي',
    'rewards.tierBenefits': 'مزايا المستوى الحالي',
    'rewards.totalEarned': 'إجمالي المكتسب',
    'rewards.totalRedeemed': 'إجمالي المستخدم',
    'rewards.transactions': 'المعاملات',
    'rewards.termsAndConditions': 'تنتهي صلاحية النقاط بعد 12 شهرًا من الكسب',
    'rewards.discountBadge': 'خصم {percent}%',
    'rewards.tierMessages.silver': 'عضوية فضية - احصل على خصومات أساسية وميزات إضافية',
    'rewards.tierMessages.gold': 'عضوية ذهبية - احصل على خصومات أكبر ومزايا إضافية',
    'rewards.tierMessages.platinum': 'عضوية بلاتينية - احصل على تجربة متميزة وحصرية',
    'rewards.howToEarnTitle': 'كيف تكسب نقاط تشيل',
    'rewards.earnDescription': 'هناك طرق عديدة لكسب نقاط تشيل',
    'rewards.earnMethods.bookings.title': 'الحجوزات',
    'rewards.earnMethods.bookings.description': 'اكسب نقطتين مقابل كل 1$ تنفقه على الحجوزات',
    'rewards.earnMethods.reviews.title': 'التقييمات',
    'rewards.earnMethods.reviews.description': 'اكسب 50 نقطة لكل تقييم تكتبه للإقامة',
    'rewards.earnMethods.referrals.title': 'دعوة الأصدقاء',
    'rewards.earnMethods.referrals.description': 'اكسب 500 نقطة عندما يقوم صديق بالتسجيل والحجز',
    'rewards.earnMethods.activities.title': 'أنشطة إضافية',
    'rewards.earnMethods.activities.description': 'اكسب نقاط إضافية من خلال المشاركة في أنشطة وفعاليات تشيل',
    'rewards.overviewTab': 'نظرة عامة',
    'rewards.historyTab': 'سجل المعاملات',
    'rewards.redemptionOptions': 'خيارات استبدال النقاط',
    'rewards.redeemDescription': 'استبدل نقاطك بمزايا وخصومات رائعة',
    'rewards.redeemMethods.discounts': 'خصومات على الحجوزات',
    'rewards.redeemDetails.discounts': 'استخدم 1000 نقطة للحصول على خصم 10$',
    'rewards.redeemPoints': 'استبدال النقاط',
    'rewards.recentTransactions': 'المعاملات الأخيرة',
    'rewards.transaction': 'المعاملة',
    'rewards.date': 'التاريخ',
    'rewards.type': 'النوع',
    'rewards.description': 'الوصف',
    'rewards.points': 'النقاط',
    'rewards.status': 'الحالة',
    'rewards.expiresOn': 'تنتهي في {date}',
    'rewards.transactionTypes.earn': 'كسب النقاط',
    'rewards.transactionTypes.redeem': 'استبدال النقاط',
    'rewards.transactionTypes.transfer': 'تحويل النقاط',
    'rewards.transactionTypes.expire': 'انتهاء النقاط',
    'rewards.statuses.active': 'نشط',
    'rewards.statuses.pending': 'معلق',
    'rewards.statuses.expired': 'منتهي',
    'rewards.statuses.cancelled': 'ملغي',
    'rewards.statusTooltips.active': 'هذه النقاط نشطة وجاهزة للاستخدام',
    'rewards.statusTooltips.pending': 'معاملة معلقة بانتظار الاكتمال',
    'rewards.statusTooltips.expired': 'انتهت صلاحية هذه النقاط ولم تعد متاحة',
    'rewards.statusTooltips.cancelled': 'تم إلغاء هذه المعاملة',
    'rewards.noTransactions': 'لا توجد معاملات بعد',
    'rewards.noTransactionsFound': 'لم يتم العثور على معاملات',
    'rewards.noFilteredResults': 'لا توجد نتائج تطابق تصفيتك',
    'rewards.searchTransactions': 'البحث في المعاملات',
    'rewards.filterByType': 'تصفية حسب النوع',
    'rewards.allTransactions': 'جميع المعاملات',
    'rewards.noRewardsTitle': 'لا توجد نقاط بعد',
    'rewards.noRewardsDescription': 'لم تكتسب أي نقاط مكافآت حتى الآن',
    'rewards.startEarning': 'ابدأ بكسب النقاط من خلال الحجز أو كتابة تقييمات',
  },
  en: {
    // AI Features translations
    'ai.recommendations.title': 'Smart Property Recommendations',
    'ai.recommendations.subtitle': 'Properties matched to your preferences by AI',
    'ai.recommendations.tabs.forYou': 'For You',
    'ai.recommendations.tabs.bestValue': 'Best Value',
    'ai.recommendations.tabs.trending': 'Trending',
    'ai.recommendations.match': 'Match',
    'ai.recommendations.whyBook': 'Why you\'ll love this property',
    'ai.recommendations.showMore': 'Show more reasons',
    'ai.recommendations.showLess': 'Show less',
    'ai.recommendations.refresh': 'Refresh recommendations',
    'ai.recommendations.error': 'We couldn\'t generate recommendations at this time',
    'ai.recommendations.errorTitle': 'Recommendations Unavailable',
    'ai.recommendations.tryAgain': 'Try Again',
    'ai.recommendations.noResultsTitle': 'No Recommendations Found',
    'ai.recommendations.noResultsDesc': 'Try adjusting your preferences for better matches',
    'ai.recommendations.resetPreferences': 'Reset Preferences',
    
    'ai.virtualTour.title': 'Enhanced Virtual Tour',
    'ai.virtualTour.subtitle': 'Explore this property with AI-powered descriptions',
    'ai.virtualTour.tabs.highlights': 'Highlights',
    'ai.virtualTour.tabs.rooms': 'Rooms',
    'ai.virtualTour.tabs.surroundings': 'Surroundings',
    'ai.virtualTour.tabs.experiences': 'Experiences',
    'ai.virtualTour.surroundingsTitle': 'Surrounding Area',
    'ai.virtualTour.experience': 'Experience',
    'ai.virtualTour.aiGenerated': 'AI Generated',
    'ai.virtualTour.regenerate': 'Regenerate',
    'ai.virtualTour.error': 'Unable to load virtual tour data',
    'ai.virtualTour.errorTitle': 'Virtual Tour Unavailable',
    'ai.virtualTour.tryAgain': 'Try Again',
    'ai.virtualTour.noDataTitle': 'No Virtual Tour Available',
    'ai.virtualTour.noDataDesc': 'Generate an enhanced virtual tour for this property',
    'ai.virtualTour.generate': 'Generate Virtual Tour',
    
    'ai.analytics.title': 'Customer Behavior Analysis',
    'ai.analytics.subtitle': 'AI-powered insights into customer preferences and patterns',
    'ai.analytics.tabs.segments': 'Customer Segments',
    'ai.analytics.tabs.reviews': 'Review Analysis',
    'ai.analytics.sentimentBreakdown': 'Sentiment Breakdown',
    'ai.analytics.positive': 'Positive',
    'ai.analytics.neutral': 'Neutral',
    'ai.analytics.negative': 'Negative',
    'ai.analytics.topPraises': 'Top Praises',
    'ai.analytics.topComplaints': 'Top Complaints',
    'ai.analytics.trendsOverTime': 'Trends Over Time',
    'ai.analytics.actionableInsights': 'Actionable Insights',
    'ai.analytics.keyInsights': 'Key Insights',
    'ai.analytics.customerSegments': 'Customer Segments',
    'ai.analytics.users': 'Users',
    'ai.analytics.targetingStrategies': 'Targeting Strategies',
    'ai.analytics.showLess': 'Show Less',
    'ai.analytics.showAll': 'Show All',
    'ai.analytics.viewCustomers': 'View Customers',
    'ai.analytics.scheduleEmail': 'Schedule Email',
    'ai.analytics.aiGenerated': 'AI Generated',
    'ai.analytics.refreshData': 'Refresh Data',
    'ai.analytics.errorTitle': 'Analysis Unavailable',
    'ai.analytics.errorReviews': 'Unable to load review analysis',
    'ai.analytics.errorSegments': 'Unable to load customer segments',
    'ai.analytics.tryAgain': 'Try Again',
    
    'ai.areaGuide.title': 'Personalized Area Guide',
    'ai.areaGuide.subtitle': 'Local recommendations tailored to your interests',
    'ai.areaGuide.tabs.overview': 'Overview',
    'ai.areaGuide.tabs.overviewShort': 'Overview',
    'ai.areaGuide.tabs.attractions': 'Attractions',
    'ai.areaGuide.tabs.attractionsShort': 'See',
    'ai.areaGuide.tabs.dining': 'Dining',
    'ai.areaGuide.tabs.diningShort': 'Eat',
    'ai.areaGuide.tabs.tips': 'Insider Tips',
    'ai.areaGuide.tabs.tipsShort': 'Tips',
    'ai.areaGuide.topAttractions': 'Top Attractions',
    'ai.areaGuide.topDining': 'Top Restaurants',
    'ai.areaGuide.transportationTips': 'Transportation Tips',
    'ai.areaGuide.insiderTips': 'Insider Tips',
    'ai.areaGuide.viewOnMap': 'View on Map',
    'ai.areaGuide.viewMenu': 'View Menu',
    'ai.areaGuide.aiGenerated': 'AI Generated',
    'ai.areaGuide.personalize': 'Personalize',
    'ai.areaGuide.error': 'Unable to load area guide',
    'ai.areaGuide.errorTitle': 'Area Guide Unavailable',
    'ai.areaGuide.tryAgain': 'Try Again',
    'ai.areaGuide.noDataTitle': 'No Area Guide Available',
    'ai.areaGuide.noDataDesc': 'Generate a personalized guide for this area',
    'ai.areaGuide.generate': 'Generate Area Guide',
    
    // Accessibility translations
    'accessibility.skipToContent': 'Skip to content',
    'accessibility.screenReaderOnly': 'Screen reader only content',
    'accessibility.reducedMotion': 'Reduced motion',
    'accessibility.highContrast': 'High contrast',
    'accessibility.darkMode': 'Dark mode',
    'accessibility.increaseText': 'Increase text size',
    'accessibility.decreaseText': 'Decrease text size',
    'accessibility.resetText': 'Reset text size',
    'accessibility.controls': 'Accessibility Settings',
    'accessibility.textSize': 'Text Size',
    
    // Rewards system translations
    'rewards.rewardsPageTitle': 'ChillPoints',
    'rewards.pageTitle': 'ChillPoints Rewards',
    'rewards.pageDescription': 'Track your points, exclusive benefits, and transaction history',
    'rewards.yourPoints': 'Your ChillPoints',
    'rewards.pointsDescription': 'Use your points for exclusive discounts and upgrades',
    'rewards.pointsTooltip': 'You earn 2 points for every $1 spent on bookings',
    'rewards.pointsWorth': 'Cash value: ${amount}',
    'rewards.currentPoints': '{points} points',
    'rewards.nextTierPoints': '{tier} ({points} points)',
    'rewards.chillPoints': 'ChillPoints',
    'rewards.availablePoints': 'Available Points',
    'rewards.currentTier': 'Current Tier',
    'rewards.nextTier': 'Next Tier',
    'rewards.toNextTier': 'to next tier',
    'rewards.expiringPoints': '{count} points expiring soon',
    'rewards.firstExpiryDate': 'First batch expires',
    'rewards.tierBenefits': 'Current Tier Benefits',
    'rewards.totalEarned': 'Total Earned',
    'rewards.totalRedeemed': 'Total Redeemed',
    'rewards.transactions': 'Transactions',
    'rewards.termsAndConditions': 'Points expire 12 months after earning',
    'rewards.discountBadge': '{percent}% discount',
    'rewards.tierMessages.silver': 'Silver membership - Access basic discounts and perks',
    'rewards.tierMessages.gold': 'Gold membership - Enjoy bigger discounts and additional perks',
    'rewards.tierMessages.platinum': 'Platinum membership - Experience premium exclusives',
    'rewards.howToEarnTitle': 'How to Earn ChillPoints',
    'rewards.earnDescription': 'There are several ways to earn ChillPoints',
    'rewards.earnMethods.bookings.title': 'Bookings',
    'rewards.earnMethods.bookings.description': 'Earn 2 points for every $1 spent on bookings',
    'rewards.earnMethods.reviews.title': 'Reviews',
    'rewards.earnMethods.reviews.description': 'Earn 50 points for each property review you write',
    'rewards.earnMethods.referrals.title': 'Refer Friends',
    'rewards.earnMethods.referrals.description': 'Earn 500 points when a friend signs up and books',
    'rewards.earnMethods.activities.title': 'Extra Activities',
    'rewards.earnMethods.activities.description': 'Earn bonus points by participating in StayChill events',
    'rewards.overviewTab': 'Overview',
    'rewards.historyTab': 'Transaction History',
    'rewards.redemptionOptions': 'Redemption Options',
    'rewards.redeemDescription': 'Redeem your points for great benefits and discounts',
    'rewards.redeemMethods.discounts': 'Booking Discounts',
    'rewards.redeemDetails.discounts': 'Use 1000 points for a $10 discount',
    'rewards.redeemPoints': 'Redeem Points',
    'rewards.recentTransactions': 'Recent Transactions',
    'rewards.transaction': 'Transaction',
    'rewards.date': 'Date',
    'rewards.type': 'Type',
    'rewards.description': 'Description',
    'rewards.points': 'Points',
    'rewards.status': 'Status',
    'rewards.expiresOn': 'Expires on {date}',
    'rewards.transactionTypes.earn': 'Points Earned',
    'rewards.transactionTypes.redeem': 'Points Redeemed',
    'rewards.transactionTypes.transfer': 'Points Transferred',
    'rewards.transactionTypes.expire': 'Points Expired',
    'rewards.statuses.active': 'Active',
    'rewards.statuses.pending': 'Pending',
    'rewards.statuses.expired': 'Expired',
    'rewards.statuses.cancelled': 'Cancelled',
    'rewards.statusTooltips.active': 'These points are active and ready to use',
    'rewards.statusTooltips.pending': 'Transaction is pending completion',
    'rewards.statusTooltips.expired': 'These points have expired and are no longer available',
    'rewards.statusTooltips.cancelled': 'This transaction was cancelled',
    'rewards.noTransactions': 'No transactions yet',
    'rewards.noTransactionsFound': 'No transactions found',
    'rewards.noFilteredResults': 'No results match your filter',
    'rewards.searchTransactions': 'Search transactions',
    'rewards.filterByType': 'Filter by type',
    'rewards.allTransactions': 'All transactions',
    'rewards.noRewardsTitle': 'No points yet',
    'rewards.noRewardsDescription': 'You haven\'t earned any reward points yet',
    'rewards.startEarning': 'Start earning points by booking or writing reviews',
  }
};

// مقدم خدمة اللغة
interface LocaleProviderProps {
  children: ReactNode;
}

export const LocaleProvider = (props: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>('ar');
  
  useEffect(() => {
    // استخدام اللغة المخزنة أو اللغة الافتراضية
    const savedLocale = localStorage.getItem('staychill-locale');
    if (savedLocale === 'en' || savedLocale === 'ar') {
      setLocaleState(savedLocale as Locale);
    } else {
      // استخدام لغة المتصفح إذا كانت مدعومة
      const browserLang = navigator.language.split('-')[0];
      setLocaleState(browserLang === 'en' ? 'en' : 'ar');
    }
  }, []);
  
  // تحديث اللغة وحفظها في التخزين المحلي
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('staychill-locale', newLocale);
    
    // تحديث اتجاه الصفحة بناءً على اللغة
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };
  
  // تأثير جانبي لضبط اتجاه الصفحة عند تغيير اللغة
  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    
    // تعديل الـ CSS للوضع RTL
    if (locale === 'ar') {
      document.body.classList.add('rtl-active');
      document.body.classList.remove('ltr-active');
    } else {
      document.body.classList.add('ltr-active');
      document.body.classList.remove('rtl-active');
    }
  }, [locale]);
  
  // وظيفة الترجمة
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[locale]?.[key] || key;
    
    if (!params) return translation;
    
    // استبدال المعلمات في سلسلة الترجمة
    return Object.entries(params).reduce((str, [param, value]) => {
      return str.replace(new RegExp(`{${param}}`, 'g'), String(value));
    }, translation);
  };
  
  const value = { locale, setLocale, t };
  
  return React.createElement(
    LocaleContext.Provider,
    { value },
    props.children
  );
};

// دالة سهلة لاستخدام الترجمة
export function useTranslation() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return context;
}

// مكون مبدل اللغة
export const LocaleSwitcher = () => {
  const { locale, setLocale } = useTranslation();
  
  return React.createElement(
    'div',
    { className: 'flex items-center space-x-2 rtl:space-x-reverse' },
    React.createElement(
      'button',
      {
        className: `px-3 py-1 text-sm rounded ${
          locale === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`,
        onClick: () => setLocale('ar')
      },
      'العربية'
    ),
    React.createElement(
      'button',
      {
        className: `px-3 py-1 text-sm rounded ${
          locale === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`,
        onClick: () => setLocale('en')
      },
      'English'
    )
  );
};

// مكون الترجمة (نص مترجم)
interface TransProps {
  i18nKey: string;
  params?: Record<string, string | number>;
}

export const Trans = (props: TransProps) => {
  const { t } = useTranslation();
  return React.createElement(
    React.Fragment,
    null,
    t(props.i18nKey, props.params)
  );
};