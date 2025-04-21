import React, { useState } from 'react';
import { useA11y } from './A11yProvider';
import { useTranslation } from '@/lib/i18n';
import { 
  Eye, 
  Plus, 
  Minus, 
  RotateCcw, 
  Zap, 
  Settings, 
  Type, 
  Layout, 
  Keyboard, 
  FastForward,
  ChevronRight
} from 'lucide-react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Slider
} from '@/components/ui/slider';
import { ScreenReaderAnnounce } from './ScreenReaderOnly';

interface A11yControlsProps {
  className?: string;
  minimal?: boolean;
  showProfileLink?: boolean;
}

/**
 * مكون A11yControls
 * 
 * يوفر واجهة للمستخدم للتحكم في إعدادات إمكانية الوصول
 * مثل تقليل الحركة، والتباين العالي، وحجم النص
 * 
 * @param className - فئات CSS اختيارية
 * @param minimal - عرض الإعدادات الأساسية فقط
 * @param showProfileLink - إظهار رابط لصفحة إعدادات الوصولية المتقدمة
 */
export const A11yControls: React.FC<A11yControlsProps> = ({ 
  className = '',
  minimal = false,
  showProfileLink = false
}) => {
  const { 
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
    
    // الإعدادات الإضافية
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
    setAnimationSpeed
  } = useA11y();
  
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState<string | null>(null);
  
  // وظيفة مساعدة لتحديث الإعلان للقارئات
  const announceChange = (message: string) => {
    setAnnouncement(message);
    // مسح الإعلان بعد 3 ثوان
    setTimeout(() => setAnnouncement(null), 3000);
  };
  
  // عرض مختصر للإعدادات الأساسية
  if (minimal) {
    return (
      <div className={`rounded-lg border p-4 ${className}`}>
        <h3 className="text-lg font-medium mb-4">{t('accessibility.controls')}</h3>
        
        <div className="space-y-4">
          {/* تقليل الحركة */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>{t('accessibility.reducedMotion')}</span>
            </div>
            <Switch
              checked={reducedMotion}
              onCheckedChange={(checked) => {
                setReducedMotion(checked);
                announceChange(
                  checked 
                    ? t('accessibility.reducedMotionEnabled') 
                    : t('accessibility.reducedMotionDisabled')
                );
              }}
              aria-label={t('accessibility.reducedMotion')}
            />
          </div>
          
          {/* التباين العالي */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{t('accessibility.highContrast')}</span>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={(checked) => {
                setHighContrast(checked);
                announceChange(
                  checked 
                    ? t('accessibility.highContrastEnabled') 
                    : t('accessibility.highContrastDisabled')
                );
              }}
              aria-label={t('accessibility.highContrast')}
            />
          </div>
          
          {/* حجم النص */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>{t('accessibility.textSize')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  decreaseTextSize();
                  announceChange(t('accessibility.textSizeDecreased'));
                }}
                className="p-1 rounded-md border hover:bg-muted"
                aria-label={t('accessibility.decreaseText')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  resetTextSize();
                  announceChange(t('accessibility.textSizeReset'));
                }}
                className="p-1 rounded-md border hover:bg-muted"
                aria-label={t('accessibility.resetText')}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  increaseTextSize();
                  announceChange(t('accessibility.textSizeIncreased'));
                }}
                className="p-1 rounded-md border hover:bg-muted"
                aria-label={t('accessibility.increaseText')}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {showProfileLink && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/accessibility-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('accessibility.moreSettings')}
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </a>
              </Button>
            </div>
          )}
        </div>
        
        {announcement && (
          <ScreenReaderAnnounce>{announcement}</ScreenReaderAnnounce>
        )}
      </div>
    );
  }
  
  // العرض الكامل للإعدادات
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('accessibility.controls')}</CardTitle>
        <CardDescription>
          {t('accessibility.controlsDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* إعدادات الحركة والتفاعل */}
          <AccordionItem value="motion">
            <AccordionTrigger className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>{t('accessibility.motionSettings')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="reduced-motion">
                    {t('accessibility.reducedMotion')}
                  </Label>
                  <Switch
                    id="reduced-motion"
                    checked={reducedMotion}
                    onCheckedChange={(checked) => {
                      setReducedMotion(checked);
                      announceChange(
                        checked 
                          ? t('accessibility.reducedMotionEnabled') 
                          : t('accessibility.reducedMotionDisabled')
                      );
                    }}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="animation-speed">
                    {t('accessibility.animationSpeed')}
                  </Label>
                  <div className="pt-2">
                    <Slider
                      id="animation-speed"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[animationSpeed]}
                      onValueChange={(values) => {
                        setAnimationSpeed(values[0]);
                        announceChange(
                          t('accessibility.animationSpeedChanged', { speed: values[0] })
                        );
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('accessibility.slower')}</span>
                    <span>{t('accessibility.default')}</span>
                    <span>{t('accessibility.faster')}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* إعدادات البصريات والتباين */}
          <AccordionItem value="visuals">
            <AccordionTrigger className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{t('accessibility.visualSettings')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="high-contrast">
                    {t('accessibility.highContrast')}
                  </Label>
                  <Switch
                    id="high-contrast"
                    checked={highContrast}
                    onCheckedChange={(checked) => {
                      setHighContrast(checked);
                      announceChange(
                        checked 
                          ? t('accessibility.highContrastEnabled') 
                          : t('accessibility.highContrastDisabled')
                      );
                    }}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="color-blind-mode">
                    {t('accessibility.colorBlindMode')}
                  </Label>
                  <Select
                    value={colorBlindMode}
                    onValueChange={(value: any) => {
                      setColorBlindMode(value);
                      announceChange(
                        t('accessibility.colorBlindModeChanged', { mode: value })
                      );
                    }}
                  >
                    <SelectTrigger id="color-blind-mode">
                      <SelectValue placeholder={t('accessibility.selectColorBlindMode')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('accessibility.noColorBlindMode')}</SelectItem>
                      <SelectItem value="protanopia">{t('accessibility.protanopia')}</SelectItem>
                      <SelectItem value="deuteranopia">{t('accessibility.deuteranopia')}</SelectItem>
                      <SelectItem value="tritanopia">{t('accessibility.tritanopia')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="simplified-ui">
                    {t('accessibility.simplifiedUI')}
                  </Label>
                  <Switch
                    id="simplified-ui"
                    checked={simplifiedUI}
                    onCheckedChange={(checked) => {
                      setSimplifiedUI(checked);
                      announceChange(
                        checked 
                          ? t('accessibility.simplifiedUIEnabled') 
                          : t('accessibility.simplifiedUIDisabled')
                      );
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* إعدادات النص والقراءة */}
          <AccordionItem value="text">
            <AccordionTrigger className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>{t('accessibility.textSettings')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="space-y-3">
                  <Label>{t('accessibility.textSize')}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        decreaseTextSize();
                        announceChange(t('accessibility.textSizeDecreased'));
                      }}
                      aria-label={t('accessibility.decreaseText')}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetTextSize();
                        announceChange(t('accessibility.textSizeReset'));
                      }}
                      aria-label={t('accessibility.resetText')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        increaseTextSize();
                        announceChange(t('accessibility.textSizeIncreased'));
                      }}
                      aria-label={t('accessibility.increaseText')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <div className="ml-4 text-sm text-muted-foreground">
                      {Math.round((textSize - 1) * 100)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="dyslexic-font">
                    {t('accessibility.dyslexicFont')}
                  </Label>
                  <Switch
                    id="dyslexic-font"
                    checked={dyslexicFont}
                    onCheckedChange={(checked) => {
                      setDyslexicFont(checked);
                      announceChange(
                        checked 
                          ? t('accessibility.dyslexicFontEnabled') 
                          : t('accessibility.dyslexicFontDisabled')
                      );
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* إعدادات التقنيات المساعدة */}
          <AccordionItem value="assistive">
            <AccordionTrigger className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              <span>{t('accessibility.assistiveTechSettings')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="keyboard-navigation">
                    {t('accessibility.enhancedKeyboardNavigation')}
                  </Label>
                  <Switch
                    id="keyboard-navigation"
                    checked={keyboardNavigationEnhanced}
                    onCheckedChange={(checked) => {
                      setKeyboardNavigationEnhanced(checked);
                      announceChange(
                        checked 
                          ? t('accessibility.keyboardNavigationEnhanced') 
                          : t('accessibility.keyboardNavigationStandard')
                      );
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="screen-reader">
                    {t('accessibility.screenReaderOptimized')}
                  </Label>
                  <Switch
                    id="screen-reader"
                    checked={screenReaderOptimized}
                    onCheckedChange={(checked) => {
                      setScreenReaderOptimized(checked);
                      announceChange(
                        checked 
                          ? t('accessibility.screenReaderOptimizedEnabled') 
                          : t('accessibility.screenReaderOptimizedDisabled')
                      );
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      
      {showProfileLink && (
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <a href="/accessibility-settings">
              <Settings className="h-4 w-4 mr-2" />
              {t('accessibility.advancedSettings')}
            </a>
          </Button>
        </CardFooter>
      )}
      
      {announcement && (
        <ScreenReaderAnnounce>{announcement}</ScreenReaderAnnounce>
      )}
    </Card>
  );
};