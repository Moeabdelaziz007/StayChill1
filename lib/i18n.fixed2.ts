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
  },
  en: {
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