import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ExternalLink } from "lucide-react";

// استيراد ملف الرسوم المتحركة
import successAnimation from "@/assets/animations/booking-success.json";

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | string;
  pointsEarned?: number;
  propertyTitle?: string;
}

const BookingSuccessModal = ({
  isOpen,
  onClose,
  bookingId,
  pointsEarned = 0,
  propertyTitle = "العقار"
}: BookingSuccessModalProps) => {
  const [, navigate] = useLocation();
  
  // إضافة تأثير صوتي عند فتح الموديل (اختياري)
  useEffect(() => {
    if (isOpen) {
      const audio = new Audio("/sounds/success.mp3");
      // محاولة تشغيل الصوت (قد يتم منعها من قبل المتصفح إذا لم يكن هناك تفاعل مع المستخدم)
      audio.play().catch(e => console.log("تم منع تشغيل الصوت تلقائيًا"));
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-xl overflow-hidden shadow-xl transform transition-all text-center">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2 text-emerald-700">
            تم تأكيد الحجز بنجاح! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            نشكرك على اختيار StayChill لإقامتك
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          <div className="w-48 h-48 mx-auto">
            <Lottie 
              animationData={successAnimation} 
              loop={false} 
              autoplay 
              className="w-full h-full" 
            />
          </div>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg mt-2 mb-4">
          <h3 className="font-semibold text-emerald-800 mb-2">{propertyTitle}</h3>
          <p className="text-gray-700 mb-2">
            رقم الحجز: <span className="font-mono font-medium">{bookingId}</span>
          </p>
          {pointsEarned > 0 && (
            <div className="mt-2 py-2 px-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-700 flex items-center justify-center gap-1">
                <span className="text-blue-500">🏆</span>
                لقد ربحت {pointsEarned} نقطة مكافأة!
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate("/my-bookings")} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            عرض تفاصيل الحجز
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
        
        {/* رابط مشاركة التجربة */}
        <div className="mt-2 pt-3 border-t border-gray-100">
          <Button 
            variant="ghost" 
            className="w-full text-sm text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-1"
            onClick={() => {
              // يمكن تنفيذ المشاركة عبر وسائل التواصل الاجتماعي هنا
              navigator.clipboard.writeText(`لقد حجزت ${propertyTitle} عبر StayChill! جرب التطبيق الآن!`)
                .then(() => {
                  alert("تم نسخ رابط المشاركة!");
                })
                .catch(err => {
                  console.error('حدث خطأ أثناء نسخ النص:', err);
                });
            }}
          >
            <ExternalLink className="h-4 w-4 ml-1" />
            شارك تجربتك مع الأصدقاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingSuccessModal;