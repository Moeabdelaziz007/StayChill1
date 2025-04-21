import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to your API
    console.log("Subscription email:", email);
    setSubmitted(true);
    toast({
      title: "تم التسجيل بنجاح!",
      description: "سنعلمك عندما يتم إصدار التطبيق أو الخدمات الجديدة",
      variant: "default",
    });
  };

  return (
    <div className="pb-12">
      {/* Hero Section - Mobile App Coming Soon */}
      <section className="relative overflow-hidden min-h-[600px] mb-16">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1494797262163-102fae527c62?auto=format&fit=crop&w=2000&q=80" 
            alt="شاطئ مصري مع هاتف" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00182A]/95 via-[#00182A]/80 to-[#00182A]/70"></div>
        </div>
        
        {/* Phone mockup with app */}
        <div className="absolute bottom-0 right-0 w-[40%] h-[90%] z-0 hidden lg:block">
          <div className="relative h-full w-full">
            <div className="absolute bottom-0 right-0 w-[80%] h-[90%] bg-[#FFD700]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-[60%] h-[80%] rounded-[40px] border-8 border-[#222] bg-[#111] shadow-2xl overflow-hidden transform rotate-6">
              <img 
                src="https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=800&q=80" 
                alt="تطبيق ستاي تشيل" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 h-full flex items-center">
          <div className="max-w-2xl py-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#FFD700]/20 backdrop-blur-sm mb-6 border border-[#FFD700]/30">
              <div className="h-2 w-2 bg-[#FFD700] rounded-full animate-pulse mr-2"></div>
              <span className="text-white font-medium">قريباً على متاجر التطبيقات</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="block mb-3">تطبيق</span>
              <span className="text-[#FFD700]">ستاي تشيل</span>
            </h1>
            
            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
              احصل على أفضل تجربة حجز شاليهات ومطاعم من خلال تطبيقنا الجديد للهواتف الذكية. اكتشف ميزات حصرية وعروض خاصة فقط لمستخدمي التطبيق.
            </p>
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <Input
                    type="email"
                    placeholder="بريدك الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#FFD700]"
                  />
                  <Button type="submit" className="bg-[#FFD700] hover:bg-[#e5c100] text-[#00182A] font-bold px-6">
                    أعلمني عند الإطلاق
                  </Button>
                </div>
                <p className="text-white/70 text-sm">نحن لا نشارك بريدك الإلكتروني مع أي جهة خارجية.</p>
              </form>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 mb-8 max-w-md">
                <div className="flex items-center mb-2">
                  <div className="bg-[#FFD700] h-8 w-8 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">تم تسجيلك بنجاح!</span>
                </div>
                <p className="text-white/80">سنخبرك عندما يتم إطلاق التطبيق.</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </div>
              </div>
              <span className="text-white/60">أو تابعنا للحصول على التحديثات</span>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Services */}
      <section className="bg-gradient-to-br from-[#00182A] to-[#001E36] rounded-2xl p-6 md:p-10 mb-12 border-2 border-[#FFD700]/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 blur-3xl rounded-full -mr-32 -mt-32 z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD700]/10 blur-3xl rounded-full -ml-32 -mb-32 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
            <div className="md:w-1/3">
              <div className="relative">
                <div className="absolute -inset-6 bg-[#FFD700]/20 blur-xl rounded-full"></div>
                <div className="bg-gradient-to-br from-[#FFD700] to-[#FFC000] h-40 w-40 rounded-3xl flex items-center justify-center shadow-xl relative transform transition-transform duration-500 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-[#00182A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="md:w-2/3 text-center md:text-right">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                <span className="text-[#FFD700]">خدمات جديدة</span> قادمة قريباً
              </h2>
              
              <p className="text-white/80 mb-8 text-lg">
                استعد لتجربة خدمات مميزة جديدة ستساعدك على قضاء وقت لا يُنسى في إجازتك. نعمل باستمرار على تطوير تجربة ستاي تشيل لتلبية احتياجاتك.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {/* Car Rental Service */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#FFD700] h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                        <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                        <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">حجز السيارات</h3>
                      <p className="text-white/70">استأجر سيارة مناسبة للتنقل بحرية في وجهتك السياحية</p>
                    </div>
                  </div>
                </div>
                
                {/* Cleaning Service */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#FFD700] h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z"></path>
                        <path d="M6 8l6 8l6 -8"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">خدمة التنظيف</h3>
                      <p className="text-white/70">تنظيف احترافي للشاليهات بمعايير فندقية عالية</p>
                    </div>
                  </div>
                </div>
                
                {/* Delivery Service */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#FFD700] h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="7" cy="17" r="2"></circle>
                        <circle cx="17" cy="17" r="2"></circle>
                        <path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">خدمة التوصيل</h3>
                      <p className="text-white/70">توصيل المشتريات والطلبات مباشرة إلى باب شاليهك</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFC000] hover:opacity-90 text-[#00182A] font-bold text-lg px-8 py-3">
                  اشترك للإشعارات
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  مزيد من المعلومات
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="container mx-auto px-6 my-12">
        <h2 className="text-3xl font-bold text-center mb-8">الأسئلة الشائعة</h2>
        
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors duration-300">
            <h3 className="text-xl font-bold mb-3">متى سيتم إطلاق التطبيق؟</h3>
            <p className="text-gray-300">نخطط لإطلاق التطبيق خلال الربع الأول من عام 2023. سنرسل إشعارًا للمشتركين قبل الإطلاق.</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors duration-300">
            <h3 className="text-xl font-bold mb-3">هل سيكون التطبيق مجانيًا؟</h3>
            <p className="text-gray-300">نعم، سيكون التطبيق متاحًا للتنزيل مجانًا على متجر Apple App Store و Google Play.</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors duration-300">
            <h3 className="text-xl font-bold mb-3">ما هي الخدمات المتوفرة في التطبيق؟</h3>
            <p className="text-gray-300">سيتضمن التطبيق جميع ميزات الموقع بالإضافة إلى إشعارات فورية للحجوزات وعروض حصرية للمستخدمين.</p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors duration-300">
            <h3 className="text-xl font-bold mb-3">كيف أحصل على المساعدة؟</h3>
            <p className="text-gray-300">يمكنك التواصل مع فريق خدمة العملاء عبر البريد الإلكتروني support@staychill.com أو الاتصال على 19XXX.</p>
          </div>
        </div>
        
        <div className="text-center mt-10">
          <Link href="/">
            <Button variant="link" className="text-[#FFD700] hover:text-[#FFC000]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M5 12L12 19M5 12L12 5"></path>
              </svg>
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ComingSoon;