import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Heart, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SocialShare from '@/components/ui/social-share';
import WhatsAppShare from '@/components/ui/whatsapp-share';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyShareCardProps {
  property: {
    id: number;
    title: string;
    location: string;
    image: string;
    price: number;
    rating?: number;
    description?: string;
  };
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * مكون PropertyShareCard - بطاقة مشاركة مخصصة للعقارات
 * 
 * توفر واجهة مخصصة لمشاركة العقارات مع صورة ومعلومات
 * وتتضمن علامات تبويب للمشاركة على منصات مختلفة أو إرسال رسالة واتساب
 */
const PropertyShareCard: React.FC<PropertyShareCardProps> = ({
  property,
  className,
  isOpen,
  onClose
}) => {
  const [tab, setTab] = useState<string>('social');
  const [isSaved, setIsSaved] = useState(false);
  
  // إنشاء رابط العقار
  const propertyUrl = `${window.location.origin}/property/${property.id}`;
  
  // رسالة المشاركة
  const shareMessage = `تحقق من هذا العقار الرائع: ${property.title} في ${property.location}`;
  
  // معالجة حفظ العقار
  const handleSaveProperty = () => {
    setIsSaved(!isSaved);
    
    toast({
      title: isSaved ? "تمت إزالة العقار من المحفوظات" : "تم حفظ العقار",
      description: isSaved 
        ? "تمت إزالة العقار من قائمة العقارات المحفوظة" 
        : "تم إضافة العقار إلى قائمة العقارات المحفوظة",
      variant: isSaved ? "default" : "default"
    });
  };
  
  // معالجة الإبلاغ عن العقار
  const handleReportProperty = () => {
    toast({
      title: "تم استلام البلاغ",
      description: "شكرًا لك! سنراجع هذا العقار في أقرب وقت ممكن.",
      variant: "default"
    });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md"
          >
            <Card className={cn("border-border shadow-xl", className)}>
              <CardHeader className="relative pb-0">
                <div className="absolute right-4 top-4 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="bg-background/80 backdrop-blur rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative aspect-video rounded-md overflow-hidden mb-3">
                  <img 
                    src={property.image} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-bold">{property.price.toLocaleString()} جنيه / ليلة</p>
                  </div>
                </div>
                
                <CardTitle className="text-lg font-bold line-clamp-2">
                  {property.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {property.location}
                </p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <Tabs defaultValue="social" value={tab} onValueChange={setTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="social">مشاركة</TabsTrigger>
                    <TabsTrigger value="whatsapp">واتساب</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="social" className="space-y-4">
                    <SocialShare
                      url={propertyUrl}
                      title={`${property.title} - StayChill`}
                      description={property.description || shareMessage}
                      image={property.image}
                    />
                  </TabsContent>
                  
                  <TabsContent value="whatsapp" className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm">مشاركة هذا العقار عبر واتساب</p>
                      
                      <textarea
                        className="w-full rounded-md border border-border bg-background p-3 text-sm"
                        rows={4}
                        defaultValue={`${shareMessage}\n\n${propertyUrl}`}
                      />
                      
                      <div className="flex justify-between gap-2">
                        <WhatsAppShare
                          url={propertyUrl}
                          message={shareMessage}
                          variant="default"
                          className="flex-1"
                        />
                        
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(`${shareMessage}\n\n${propertyUrl}`);
                            toast({
                              title: "تم النسخ",
                              description: "تم نسخ رسالة المشاركة إلى الحافظة",
                            });
                          }}
                        >
                          نسخ النص
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              <CardFooter className="border-t border-border pt-4 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex gap-1 items-center"
                  onClick={handleSaveProperty}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isSaved ? "fill-red-500 text-red-500" : ""
                    )}
                  />
                  <span>{isSaved ? 'تم الحفظ' : 'حفظ'}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex gap-1 items-center text-muted-foreground"
                  onClick={handleReportProperty}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>إبلاغ</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PropertyShareCard;