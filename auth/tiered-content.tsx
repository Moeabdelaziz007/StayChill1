import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserHighestTier } from '@/lib/access-control';

// نوع لعنصر محتوى لمستوى محدد
interface TierContentItem {
  tier: string;
  content: ReactNode;
}

// خصائص مكون TieredContent
interface TieredContentProps {
  contents: TierContentItem[];
  fallback?: ReactNode;
}

/**
 * مكون TieredContent - يعرض محتوى مختلف حسب مستوى صلاحيات المستخدم
 * 
 * يسمح بتحديد محتوى مختلف لكل مستوى من مستويات الوصول
 * وسيقوم المكون تلقائياً بعرض المحتوى المناسب حسب مستوى المستخدم
 * 
 * @example
 * <TieredContent 
 *   contents={[
 *     { tier: ACCESS_TIERS.BASE, content: <p>محتوى أساسي للجميع</p> },
 *     { tier: ACCESS_TIERS.TIER_1, content: <p>محتوى للمستخدمين المسجلين</p> },
 *     { tier: ACCESS_TIERS.TIER_2, content: <p>محتوى لمشرفي العقارات</p> },
 *     { tier: ACCESS_TIERS.TIER_3, content: <p>محتوى للمدير العام</p> }
 *   ]}
 *   fallback={<p>يرجى تسجيل الدخول لعرض المحتوى</p>}
 * />
 */
const TieredContent: React.FC<TieredContentProps> = ({ contents, fallback }) => {
  const { user, isLoading } = useAuth();
  
  // أثناء تحميل بيانات المستخدم، نعرض شاشة تحميل
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[100px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // إذا لم يكن هناك مستخدم، نعرض المحتوى الافتراضي (إن وجد)
  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }
  
  // نحصل على أعلى مستوى وصول للمستخدم
  const userHighestTier = getUserHighestTier(user);
  
  // نبحث عن أعلى مستوى محتوى يمكن للمستخدم الوصول إليه
  // نقوم بترتيب المحتويات تنازلياً حسب المستوى، ونعرض أول محتوى يتطابق مع مستوى المستخدم أو أقل
  const sortedContents = [...contents].sort((a, b) => {
    if (a.tier > b.tier) return -1;
    if (a.tier < b.tier) return 1;
    return 0;
  });
  
  // نجد أعلى مستوى يستطيع المستخدم الوصول إليه
  const matchingContent = sortedContents.find(item => userHighestTier >= item.tier);
  
  // نعرض المحتوى المطابق أو المحتوى الافتراضي
  return matchingContent ? <>{matchingContent.content}</> : (fallback ? <>{fallback}</> : null);
};

export default TieredContent;