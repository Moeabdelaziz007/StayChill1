import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, AlertTriangle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface RewardsRedeemDialogProps {
  // العرض المحدد للاستبدال (اختياري)
  offer?: {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    category?: string;
    expiryDays?: number;
  } | null;
  
  // رصيد النقاط الحالي للمستخدم
  userPoints: number;
  
  // دالة يتم استدعاؤها عند تأكيد الاستبدال
  onConfirm: () => void;
  
  // دالة يتم استدعاؤها عند إغلاق النافذة
  onClose: () => void;
}

/**
 * مكون نافذة حوار استبدال النقاط
 * يسمح للمستخدم باستبدال نقاطه بالمكافآت المتاحة
 */
const RewardsRedeemDialog = ({ offer, userPoints, onConfirm, onClose }: RewardsRedeemDialogProps) => {
  // حالة النموذج
  const [selectedAmount, setSelectedAmount] = useState<number>(offer?.pointsCost || 500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [redeemOption, setRedeemOption] = useState<string>(offer ? 'offer' : 'discount');
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  // حساب قيمة الخصم المقابلة للنقاط
  const getDiscountValue = (points: number): number => {
    // نستخدم معدل تحويل 100 نقطة = 5 دولار
    return Math.floor(points / 100) * 5;
  };
  
  // الحد الأقصى للنقاط التي يمكن استبدالها
  const maxPoints = Math.min(userPoints, 10000);
  
  // التحقق مما إذا كان يمكن متابعة الاستبدال
  const canProceed = agreeToTerms && selectedAmount <= userPoints && selectedAmount > 0;
  
  // معالجة تغيير خيار الاستبدال
  const handleRedeemOptionChange = (value: string) => {
    setRedeemOption(value);
    
    // إعادة تعيين المبلغ المحدد بناءً على الخيار الجديد
    if (value === 'offer' && offer) {
      setSelectedAmount(offer.pointsCost);
    } else {
      setSelectedAmount(500);
    }
  };
  
  // معالجة تغيير المبلغ المخصص
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    
    const numValue = parseInt(value);
    if (numValue && !isNaN(numValue)) {
      setSelectedAmount(Math.min(numValue, maxPoints));
    } else {
      setSelectedAmount(0);
    }
  };
  
  // معالجة تغيير القيمة المحددة مسبقًا
  const handlePredefinedAmountChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue && !isNaN(numValue)) {
      setSelectedAmount(numValue);
      setCustomAmount(numValue.toString());
    }
  };
  
  // معالجة تقديم النموذج
  const handleSubmit = async () => {
    if (!canProceed) return;
    
    setIsSubmitting(true);
    
    try {
      // في الحالة الحقيقية، سيتم استدعاء واجهة برمجة التطبيقات هنا
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // عرض رسالة النجاح
      setShowSuccess(true);
      
      // إغلاق نافذة الحوار بعد فترة
      setTimeout(() => {
        onConfirm();
      }, 2000);
    } catch (error) {
      console.error('فشل استبدال النقاط:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // عرض نافذة النجاح
  if (showSuccess) {
    return (
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle>تم استبدال النقاط بنجاح!</DialogTitle>
          <DialogDescription>
            {redeemOption === 'offer' && offer
              ? `تم استبدال ${offer.pointsCost} نقطة بـ ${offer.title}.`
              : `تم استبدال ${selectedAmount} نقطة للحصول على خصم بقيمة ${formatCurrency(getDiscountValue(selectedAmount))}.`
            }
          </DialogDescription>
        </div>
      </DialogContent>
    );
  }
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          استبدال النقاط
        </DialogTitle>
        <DialogDescription>
          {offer
            ? `استبدال النقاط للحصول على ${offer.title}`
            : 'استبدل نقاطك للحصول على مكافآت أو خصومات'
          }
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2">
        {/* عرض رصيد النقاط الحالي */}
        <div className="bg-muted rounded-md p-3 text-sm flex justify-between">
          <span>رصيد النقاط الحالي:</span>
          <span className="font-semibold">{userPoints.toLocaleString()} نقطة</span>
        </div>
        
        {/* اختيار نوع الاستبدال */}
        {!offer && (
          <div className="space-y-2">
            <Label htmlFor="redeemOption">اختر نوع الاستبدال</Label>
            <Select
              value={redeemOption}
              onValueChange={handleRedeemOptionChange}
            >
              <SelectTrigger id="redeemOption">
                <SelectValue placeholder="اختر نوع الاستبدال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">خصم على الحجز القادم</SelectItem>
                <SelectItem value="upgrade">ترقية الغرفة</SelectItem>
                <SelectItem value="voucher">قسيمة هدايا</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* اختيار عدد النقاط المراد استبدالها */}
        {!offer && (
          <div className="space-y-2">
            <Label htmlFor="pointsAmount">عدد النقاط</Label>
            
            {/* أزرار للقيم الشائعة */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[500, 1000, 2000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={selectedAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePredefinedAmountChange(amount.toString())}
                  disabled={amount > userPoints}
                >
                  {amount.toLocaleString()}
                </Button>
              ))}
            </div>
            
            {/* إدخال مخصص */}
            <Input
              id="pointsAmount"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="أدخل عدد النقاط"
            />
            
            {/* عرض قيمة الخصم المقابلة */}
            {redeemOption === 'discount' && selectedAmount > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                {`قيمة الخصم: ${formatCurrency(getDiscountValue(selectedAmount))}`}
              </div>
            )}
          </div>
        )}
        
        {/* ملخص الاستبدال */}
        <div className="border rounded-md p-3 space-y-2">
          <h4 className="font-medium">تفاصيل الاستبدال</h4>
          
          {offer ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>العرض:</span>
                <span>{offer.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>الوصف:</span>
                <span>{offer.description}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>النقاط المطلوبة:</span>
                <span>{offer.pointsCost.toLocaleString()}</span>
              </div>
              {offer.expiryDays && (
                <div className="flex justify-between text-muted-foreground">
                  <span>الصلاحية:</span>
                  <span>{offer.expiryDays} يوم</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>نوع الاستبدال:</span>
                <span>
                  {redeemOption === 'discount' ? 'خصم على الحجز' : 
                   redeemOption === 'upgrade' ? 'ترقية الغرفة' : 
                   'قسيمة هدايا'}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>النقاط:</span>
                <span>{selectedAmount.toLocaleString()}</span>
              </div>
              {redeemOption === 'discount' && (
                <div className="flex justify-between">
                  <span>قيمة الخصم:</span>
                  <span>{formatCurrency(getDiscountValue(selectedAmount))}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* رسالة تحذير إذا كانت النقاط غير كافية */}
        {selectedAmount > userPoints && (
          <div className="bg-yellow-50 text-yellow-800 rounded-md p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <strong>نقاط غير كافية</strong>
              <p>لديك {userPoints.toLocaleString()} نقطة فقط. يرجى اختيار قيمة أقل.</p>
            </div>
          </div>
        )}
        
        {/* الموافقة على الشروط والأحكام */}
        <div className="flex items-start space-x-2 space-x-reverse">
          <Checkbox 
            id="terms" 
            checked={agreeToTerms} 
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
          />
          <Label
            htmlFor="terms"
            className="text-sm leading-tight"
          >
            أوافق على شروط وأحكام استبدال النقاط وأدرك أن هذه العملية لا يمكن إلغاؤها بعد التأكيد.
          </Label>
        </div>
      </div>
      
      <DialogFooter className="flex gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canProceed || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              جارٍ المعالجة...
            </>
          ) : (
            <>
              تأكيد الاستبدال
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RewardsRedeemDialog;