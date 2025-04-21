import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, CircleDot, Clock, ArrowRight } from 'lucide-react';

export interface JourneyStep {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'delayed' | 'optional';
  timestamp?: Date;
  estimatedTime?: number; // in minutes
  icon?: React.ReactNode;
}

interface JourneyProgressTrackerProps {
  steps: JourneyStep[];
  orientation?: 'horizontal' | 'vertical';
  showEstimatedTime?: boolean;
  showDateInfo?: boolean;
  showDescription?: boolean;
  stepClassName?: string;
  className?: string;
  onStepClick?: (stepId: string) => void;
  locale?: string;
  colorScheme?: 'default' | 'muted' | 'accent';
  animated?: boolean;
  showLabels?: boolean;
}

/**
 * مكون محسن للأداء لتتبع تقدم المستخدم عبر مراحل مختلفة
 * يدعم العرض الأفقي والعمودي مع تحريكات سلسة
 */
export function JourneyProgressTracker({
  steps,
  orientation = 'horizontal',
  showEstimatedTime = true,
  showDateInfo = true,
  showDescription = true,
  stepClassName,
  className,
  onStepClick,
  locale = 'ar-EG',
  colorScheme = 'default',
  animated = true,
  showLabels = true,
}: JourneyProgressTrackerProps) {
  // تطبيق useMemo لمنع إعادة الحساب غير الضرورية
  const completedSteps = useMemo(() => {
    return steps.filter(step => step.status === 'completed').length;
  }, [steps]);
  
  const progressPercentage = useMemo(() => {
    return Math.round((completedSteps / Math.max(1, steps.length - 1)) * 100);
  }, [completedSteps, steps.length]);
  
  // تحويل جميع البيانات الثابتة إلى useMemo لتحسين الأداء
  const colorClasses = useMemo(() => {
    switch (colorScheme) {
      case 'muted':
        return {
          completed: 'bg-muted-foreground text-muted-foreground border-muted-foreground',
          completedText: 'text-muted-foreground',
          current: 'bg-primary text-primary-foreground border-primary',
          currentText: 'text-primary',
          upcoming: 'bg-muted text-muted-foreground border-muted',
          upcomingText: 'text-muted-foreground',
          line: 'bg-muted',
          completedLine: 'bg-muted-foreground',
        };
      case 'accent':
        return {
          completed: 'bg-accent text-accent-foreground border-accent',
          completedText: 'text-accent-foreground',
          current: 'bg-secondary text-secondary-foreground border-secondary',
          currentText: 'text-secondary',
          upcoming: 'bg-muted text-muted-foreground border-muted',
          upcomingText: 'text-muted-foreground',
          line: 'bg-muted',
          completedLine: 'bg-accent',
        };
      default:
        return {
          completed: 'bg-primary text-primary-foreground border-primary',
          completedText: 'text-primary',
          current: 'bg-secondary text-secondary-foreground border-secondary',
          currentText: 'text-secondary',
          upcoming: 'bg-muted text-muted-foreground border-muted',
          upcomingText: 'text-muted-foreground',
          line: 'bg-muted',
          completedLine: 'bg-primary',
        };
    }
  }, [colorScheme]);
  
  // تنسيق التاريخ بالوقت المحلي المناسب
  const formatDate = useMemo(() => {
    return (date: Date) => {
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };
  }, [locale]);
  
  // تنسيق الوقت التقديري
  const formatEstimatedTime = useMemo(() => {
    return (minutes: number) => {
      if (minutes < 60) {
        return `${minutes} دقيقة`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
          return `${hours} ساعة`;
        } else {
          return `${hours} س ${remainingMinutes} د`;
        }
      }
    };
  }, []);
  
  // الحصول على أيقونة الحالة المناسبة
  const getStatusIcon = useMemo(() => {
    return (step: JourneyStep) => {
      if (step.icon) return step.icon;
      
      switch (step.status) {
        case 'completed':
          return <Check className="w-4 h-4" />;
        case 'current':
          return <CircleDot className="w-4 h-4" />;
        case 'delayed':
          return <Clock className="w-4 h-4" />;
        case 'upcoming':
        case 'optional':
        default:
          return <ArrowRight className="w-4 h-4" />;
      }
    };
  }, []);
  
  // الحصول على فئات CSS المناسبة للحالة
  const getStatusClasses = useMemo(() => {
    return (status: JourneyStep['status']) => {
      switch (status) {
        case 'completed':
          return colorClasses.completed;
        case 'current':
          return colorClasses.current;
        case 'delayed':
          return 'bg-yellow-500 text-white border-yellow-500';
        case 'optional':
          return 'bg-purple-100 text-purple-700 border-purple-300';
        case 'upcoming':
        default:
          return colorClasses.upcoming;
      }
    };
  }, [colorClasses]);
  
  const getTextClasses = useMemo(() => {
    return (status: JourneyStep['status']) => {
      switch (status) {
        case 'completed':
          return colorClasses.completedText;
        case 'current':
          return colorClasses.currentText;
        case 'delayed':
          return 'text-yellow-600';
        case 'optional':
          return 'text-purple-700';
        case 'upcoming':
        default:
          return colorClasses.upcomingText;
      }
    };
  }, [colorClasses]);
  
  // تحديد ما إذا كان العرض أفقيًا
  const isHorizontal = orientation === 'horizontal';
  
  // أنيميشن للمكونات
  const stepVariants = {
    initial: { 
      opacity: 0, 
      y: isHorizontal ? 10 : 0,
      x: !isHorizontal ? 10 : 0 
    },
    animate: (index: number) => ({ 
      opacity: 1, 
      y: 0,
      x: 0,
      transition: { 
        delay: 0.05 * index,
        duration: 0.3,
      }
    }),
  };
  
  const progressVariants = {
    initial: { width: '0%' },
    animate: { width: `${progressPercentage}%`, transition: { duration: 0.8, ease: 'easeOut' } },
  };
  
  return (
    <div className={cn(
      "relative",
      isHorizontal ? "w-full" : "h-full flex",
      className
    )}>
      {/* شريط التقدم */}
      {isHorizontal && (
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
          {animated ? (
            <motion.div
              initial="initial"
              animate="animate"
              variants={progressVariants}
              className={cn("h-full", colorClasses.completedLine)}
            />
          ) : (
            <div 
              className={cn("h-full", colorClasses.completedLine)} 
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>
      )}
      
      {/* مراحل الرحلة */}
      <div className={cn(
        "relative z-10",
        isHorizontal 
          ? "flex justify-between gap-4" 
          : "flex flex-col h-full gap-4 flex-grow"
      )}>
        {steps.map((step, index) => {
          const stepComplete = step.status === 'completed';
          const stepCurrent = step.status === 'current';
          const isClickable = typeof onStepClick === 'function';
          
          return animated ? (
            <motion.div
              key={step.id}
              custom={index}
              initial="initial"
              animate="animate"
              variants={stepVariants}
              className={cn(
                "flex flex-grow",
                isHorizontal ? "flex-col items-center" : "items-center",
                stepClassName
              )}
              onClick={isClickable ? () => onStepClick?.(step.id) : undefined}
              style={isHorizontal ? { flexBasis: `${100 / steps.length}%` } : undefined}
            >
              {renderStepContent(step, index)}
            </motion.div>
          ) : (
            <div
              key={step.id}
              className={cn(
                "flex flex-grow",
                isHorizontal ? "flex-col items-center" : "items-center",
                stepClassName
              )}
              onClick={isClickable ? () => onStepClick?.(step.id) : undefined}
              style={isHorizontal ? { flexBasis: `${100 / steps.length}%` } : undefined}
            >
              {renderStepContent(step, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
  
  // استخدام دالة منفصلة لتقليل التكرار
  function renderStepContent(step: JourneyStep, index: number) {
    const stepComplete = step.status === 'completed';
    const stepCurrent = step.status === 'current';
    const stepBefore = steps.slice(0, index).some(s => s.status === 'current');
    const statusClasses = getStatusClasses(step.status);
    const textClasses = getTextClasses(step.status);
    
    return (
      <>
        {/* مؤشر الخطوة */}
        <div className={cn(
          "flex items-center justify-center",
          isHorizontal ? "mb-3" : "mr-3",
          "w-8 h-8 rounded-full border-2 transition-colors",
          statusClasses,
          isHorizontal ? "" : "shrink-0"
        )}>
          {getStatusIcon(step)}
        </div>
        
        {/* معلومات الخطوة */}
        <div className={cn(
          "flex flex-col",
          isHorizontal ? "text-center items-center" : "text-right",
          isHorizontal ? "w-full" : ""
        )}>
          {showLabels && (
            <h4 className={cn(
              "font-medium text-sm mb-0.5 transition-colors",
              textClasses
            )}>
              {step.title}
            </h4>
          )}
          
          {showDescription && step.description && (
            <p className="text-xs text-muted-foreground">
              {step.description}
            </p>
          )}
          
          {/* معلومات الوقت */}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {showDateInfo && step.timestamp && (
              <span>{formatDate(step.timestamp)}</span>
            )}
            
            {showEstimatedTime && step.estimatedTime && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatEstimatedTime(step.estimatedTime)}
              </span>
            )}
          </div>
        </div>
      </>
    );
  }
}

export default JourneyProgressTracker;