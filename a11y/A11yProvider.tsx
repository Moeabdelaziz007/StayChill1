import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface A11yContextState {
  // الإعدادات الأساسية
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  
  // حجم النص
  textSize: number;
  setTextSize: (value: number) => void;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  resetTextSize: () => void;
  
  // إعدادات إضافية
  dyslexicFont: boolean;
  setDyslexicFont: (value: boolean) => void;
  simplifiedUI: boolean;
  setSimplifiedUI: (value: boolean) => void;
  colorBlindMode: string;
  setColorBlindMode: (value: string) => void;
  keyboardNavigationEnhanced: boolean;
  setKeyboardNavigationEnhanced: (value: boolean) => void;
  screenReaderOptimized: boolean;
  setScreenReaderOptimized: (value: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (value: number) => void;
  
  // ملف تعريف
  saveProfile: (name: string) => void;
  loadProfile: (name: string) => void;
  deleteProfile: (name: string) => void;
  
  // إعادة تعيين جميع الإعدادات
  resetAll: () => void;
}

const A11yContext = createContext<A11yContextState | null>(null);

export const useA11y = () => {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
};

interface A11yProviderProps {
  children: ReactNode;
}

export const A11yProvider: React.FC<A11yProviderProps> = ({ children }) => {
  // الإعدادات الأساسية مع القيم الافتراضية
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  
  // حجم النص (1 = عادي)
  const [textSize, setTextSize] = useState(1);
  
  // إعدادات إضافية
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [simplifiedUI, setSimplifiedUI] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [keyboardNavigationEnhanced, setKeyboardNavigationEnhanced] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 1 = عادي

  // تحميل الإعدادات المحفوظة عند التحميل
  useEffect(() => {
    // محاولة تحميل الإعدادات من التخزين المحلي
    try {
      const savedSettings = localStorage.getItem('a11y-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // تطبيق الإعدادات المحفوظة
        setReducedMotion(parsedSettings.reducedMotion ?? false);
        setHighContrast(parsedSettings.highContrast ?? false);
        setTextSize(parsedSettings.textSize ?? 1);
        setDyslexicFont(parsedSettings.dyslexicFont ?? false);
        setSimplifiedUI(parsedSettings.simplifiedUI ?? false);
        setColorBlindMode(parsedSettings.colorBlindMode ?? 'none');
        setKeyboardNavigationEnhanced(parsedSettings.keyboardNavigationEnhanced ?? false);
        setScreenReaderOptimized(parsedSettings.screenReaderOptimized ?? false);
        setAnimationSpeed(parsedSettings.animationSpeed ?? 1);
      }
      
      // تفعيل تنسيقات CSS استنادًا إلى الإعدادات
      applySystemPreferences();
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  }, []);
  
  // حفظ الإعدادات عند تغييرها
  useEffect(() => {
    try {
      const settings = {
        reducedMotion,
        highContrast,
        textSize,
        dyslexicFont,
        simplifiedUI,
        colorBlindMode,
        keyboardNavigationEnhanced,
        screenReaderOptimized,
        animationSpeed,
      };
      
      localStorage.setItem('a11y-settings', JSON.stringify(settings));
      
      // تطبيق الإعدادات على الصفحة
      applySettings();
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  }, [
    reducedMotion,
    highContrast,
    textSize,
    dyslexicFont,
    simplifiedUI,
    colorBlindMode,
    keyboardNavigationEnhanced,
    screenReaderOptimized,
    animationSpeed,
  ]);
  
  // وظائف زيادة/إنقاص/إعادة تعيين حجم النص
  const increaseTextSize = () => {
    setTextSize(prev => Math.min(prev + 0.1, 1.5));
  };
  
  const decreaseTextSize = () => {
    setTextSize(prev => Math.max(prev - 0.1, 0.8));
  };
  
  const resetTextSize = () => {
    setTextSize(1);
  };
  
  // وظائف إدارة ملفات التعريف
  const saveProfile = (name: string) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('a11y-profiles') || '{}');
      
      profiles[name] = {
        reducedMotion,
        highContrast,
        textSize,
        dyslexicFont,
        simplifiedUI,
        colorBlindMode,
        keyboardNavigationEnhanced,
        screenReaderOptimized,
        animationSpeed,
      };
      
      localStorage.setItem('a11y-profiles', JSON.stringify(profiles));
    } catch (error) {
      console.error('Error saving accessibility profile:', error);
    }
  };
  
  const loadProfile = (name: string) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('a11y-profiles') || '{}');
      const profile = profiles[name];
      
      if (profile) {
        setReducedMotion(profile.reducedMotion ?? false);
        setHighContrast(profile.highContrast ?? false);
        setTextSize(profile.textSize ?? 1);
        setDyslexicFont(profile.dyslexicFont ?? false);
        setSimplifiedUI(profile.simplifiedUI ?? false);
        setColorBlindMode(profile.colorBlindMode ?? 'none');
        setKeyboardNavigationEnhanced(profile.keyboardNavigationEnhanced ?? false);
        setScreenReaderOptimized(profile.screenReaderOptimized ?? false);
        setAnimationSpeed(profile.animationSpeed ?? 1);
      }
    } catch (error) {
      console.error('Error loading accessibility profile:', error);
    }
  };
  
  const deleteProfile = (name: string) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('a11y-profiles') || '{}');
      
      if (profiles[name]) {
        delete profiles[name];
        localStorage.setItem('a11y-profiles', JSON.stringify(profiles));
      }
    } catch (error) {
      console.error('Error deleting accessibility profile:', error);
    }
  };
  
  // إعادة تعيين جميع الإعدادات
  const resetAll = () => {
    setReducedMotion(false);
    setHighContrast(false);
    setTextSize(1);
    setDyslexicFont(false);
    setSimplifiedUI(false);
    setColorBlindMode('none');
    setKeyboardNavigationEnhanced(false);
    setScreenReaderOptimized(false);
    setAnimationSpeed(1);
  };
  
  // تفعيل تفضيلات النظام إذا كانت متاحة
  const applySystemPreferences = () => {
    // التحقق من تفضيلات تقليل الحركة
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setReducedMotion(true);
    }
    
    // التحقق من تفضيلات التباين
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    if (prefersHighContrast) {
      setHighContrast(true);
    }
  };
  
  // تطبيق الإعدادات على العناصر في الصفحة
  const applySettings = () => {
    // جلب العنصر الجذر للمستند
    const htmlElement = document.documentElement;
    
    // تطبيق فئات الوصولية
    if (reducedMotion) {
      htmlElement.classList.add('reduce-motion');
    } else {
      htmlElement.classList.remove('reduce-motion');
    }
    
    if (highContrast) {
      htmlElement.classList.add('high-contrast');
    } else {
      htmlElement.classList.remove('high-contrast');
    }
    
    if (dyslexicFont) {
      htmlElement.classList.add('dyslexic-font');
    } else {
      htmlElement.classList.remove('dyslexic-font');
    }
    
    if (simplifiedUI) {
      htmlElement.classList.add('simplified-ui');
    } else {
      htmlElement.classList.remove('simplified-ui');
    }
    
    if (colorBlindMode !== 'none') {
      htmlElement.classList.add(`color-blind-${colorBlindMode}`);
      ['color-blind-protanopia', 'color-blind-deuteranopia', 'color-blind-tritanopia']
        .filter(cls => cls !== `color-blind-${colorBlindMode}`)
        .forEach(cls => htmlElement.classList.remove(cls));
    } else {
      ['color-blind-protanopia', 'color-blind-deuteranopia', 'color-blind-tritanopia']
        .forEach(cls => htmlElement.classList.remove(cls));
    }
    
    // تعيين أنماط مخصصة
    htmlElement.style.setProperty('--text-size-factor', textSize.toString());
    htmlElement.style.setProperty('--animation-speed-factor', animationSpeed.toString());
  };
  
  const contextValue: A11yContextState = {
    // الإعدادات الأساسية
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    
    // حجم النص
    textSize,
    setTextSize,
    increaseTextSize,
    decreaseTextSize,
    resetTextSize,
    
    // إعدادات إضافية
    dyslexicFont,
    setDyslexicFont,
    simplifiedUI,
    setSimplifiedUI,
    colorBlindMode,
    setColorBlindMode,
    keyboardNavigationEnhanced,
    setKeyboardNavigationEnhanced,
    screenReaderOptimized,
    setScreenReaderOptimized,
    animationSpeed,
    setAnimationSpeed,
    
    // ملف تعريف
    saveProfile,
    loadProfile,
    deleteProfile,
    
    // إعادة تعيين
    resetAll,
  };
  
  return (
    <A11yContext.Provider value={contextValue}>
      {children}
    </A11yContext.Provider>
  );
};