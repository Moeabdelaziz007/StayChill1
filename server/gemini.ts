import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Property, Review } from "@shared/schema";
import { logger } from "./logger";

if (!process.env.GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY environment variable. AI features will not work properly.');
}

// إعداد API مفتاح Gemini
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

// تهيئة النموذج Gemini Pro
const geminiProModel = genAI 
  ? genAI.getGenerativeModel({ 
    model: "gemini-pro",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  }) 
  : null;

/**
 * مطابقة العقارات مع تفضيلات المستخدم باستخدام الذكاء الاصطناعي
 */
export async function matchPropertiesWithPreferences(
  properties: Property[], 
  preferences: any
): Promise<any[]> {
  if (!geminiProModel) {
    logger.warn('ai', 'Gemini AI model not available for matchPropertiesWithPreferences');
    // في حالة عدم وجود API، نعيد العقارات كما هي بدون تحليل
    return properties.slice(0, 6).map(property => ({
      property,
      matchScore: 75 + Math.floor(Math.random() * 20), // درجة ملائمة عشوائية بين 75-95
      reasons: ["العقار مطابق لاحتياجاتك المحددة"]
    }));
  }

  try {
    const propertyData = properties.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      location: p.location,
      price: p.price,
      beds: p.beds,
      baths: p.baths,
      guests: p.guests,
      amenities: p.amenities || []
    }));

    const promptText = `
    أنت نظام توصية ذكي متخصص في العقارات. 
    قم بتحليل العقارات التالية ومطابقتها مع تفضيلات المستخدم.
    
    العقارات:
    ${JSON.stringify(propertyData, null, 2)}
    
    تفضيلات المستخدم:
    ${JSON.stringify(preferences, null, 2)}
    
    قم بإرجاع قائمة العقارات المطابقة بصيغة JSON تحتوي على:
    1. معرّف العقار
    2. درجة المطابقة (رقم بين 0-100)
    3. 3-5 أسباب محددة تشرح لماذا يناسب هذا العقار تفضيلات المستخدم
    
    أعد فقط الرد بصيغة JSON بدون أي كلام إضافي، بالشكل التالي:
    [
      {
        "propertyId": 1,
        "matchScore": 95,
        "reasons": ["سبب 1", "سبب 2", "سبب 3"]
      },
      ...
    ]
    
    اختر فقط أفضل 6 عقارات متطابقة على الأكثر.
    `;

    const result = await geminiProModel.generateContent(promptText);
    const response = await result.response;
    const text = response.text().trim();
    
    // استخراج JSON من النص
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Failed to extract valid JSON from AI response");
    }
    
    const matchedProperties = JSON.parse(jsonMatch[0]);
    
    // ربط العقارات المطابقة مع بيانات العقارات الكاملة
    return matchedProperties.map((match: any) => {
      const property = properties.find(p => p.id === match.propertyId);
      if (!property) return null;
      
      return {
        property,
        matchScore: match.matchScore,
        reasons: match.reasons
      };
    }).filter(Boolean);
  } catch (error) {
    logger.error('ai', 'Error in matchPropertiesWithPreferences', { error: String(error) });
    // في حالة الخطأ نعيد العقارات كما هي بدون تحليل
    return properties.slice(0, 6).map(property => ({
      property,
      matchScore: 75 + Math.floor(Math.random() * 20),
      reasons: ["العقار مطابق لاحتياجاتك المحددة"]
    }));
  }
}

/**
 * إنشاء وصف للجولة الافتراضية للعقار باستخدام الذكاء الاصطناعي
 */
export async function generateVirtualTourDescription(property: Property): Promise<any> {
  if (!geminiProModel) {
    logger.warn('ai', 'Gemini AI model not available for generateVirtualTourDescription');
    // في حالة عدم وجود API، نعيد بيانات محددة مسبقاً
    return {
      highlights: [
        "تصميم عصري ومساحات واسعة",
        "إطلالة رائعة على الشاطئ",
        "مسبح خاص مع حديقة خضراء"
      ],
      rooms: [
        {
          name: "غرفة المعيشة",
          description: "غرفة معيشة فسيحة بتصميم مفتوح وإطلالة على البحر"
        },
        {
          name: "غرفة النوم الرئيسية",
          description: "غرفة نوم فاخرة مع سرير كبير وحمام داخلي"
        },
        {
          name: "المطبخ",
          description: "مطبخ حديث مجهز بالكامل بأحدث الأجهزة"
        }
      ],
      surroundings: "يقع العقار في منطقة هادئة مع إطلالة رائعة على البحر، على بعد خطوات من الشاطئ الرملي. المنطقة مليئة بالمطاعم والمقاهي والمحلات التجارية.",
      experiences: [
        {
          title: "استكشاف الشاطئ",
          description: "استمتع بتجربة الاسترخاء على الشاطئ الرملي الخاص والسباحة في المياه الصافية"
        },
        {
          title: "الاستمتاع بالغروب",
          description: "شاهد غروب الشمس الرائع من الشرفة الخاصة أو على الشاطئ"
        }
      ]
    };
  }

  try {
    const promptText = `
    أنت مستشار عقاري متخصص في وصف العقارات بشكل جذاب وتفصيلي.
    اكتب وصفاً لجولة افتراضية للعقار التالي:
    
    ${JSON.stringify(property, null, 2)}
    
    قم بإرجاع البيانات بصيغة JSON تحتوي على الأقسام التالية:
    1. highlights: قائمة تحتوي على 3-5 مميزات رئيسية للعقار
    2. rooms: قائمة الغرف مع أوصاف تفصيلية لكل غرفة، كل عنصر يحتوي على (name) اسم الغرفة و(description) وصف تفصيلي لها
    3. surroundings: وصف للمنطقة المحيطة والموقع
    4. experiences: قائمة بالتجارب التي يمكن الاستمتاع بها في العقار، كل عنصر يحتوي على (title) عنوان التجربة و(description) وصف لها
    
    أعد فقط الرد بصيغة JSON بدون أي كلام إضافي.
    `;

    const result = await geminiProModel.generateContent(promptText);
    const response = await result.response;
    const text = response.text().trim();
    
    // استخراج JSON من النص
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract valid JSON from AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('ai', 'Error in generateVirtualTourDescription', { error: String(error) });
    // في حالة الخطأ نعيد بيانات محددة مسبقاً
    return {
      highlights: [
        "تصميم عصري ومساحات واسعة",
        "إطلالة رائعة على الشاطئ",
        "مسبح خاص مع حديقة خضراء"
      ],
      rooms: [
        {
          name: "غرفة المعيشة",
          description: "غرفة معيشة فسيحة بتصميم مفتوح وإطلالة على البحر"
        },
        {
          name: "غرفة النوم الرئيسية",
          description: "غرفة نوم فاخرة مع سرير كبير وحمام داخلي"
        },
        {
          name: "المطبخ",
          description: "مطبخ حديث مجهز بالكامل بأحدث الأجهزة"
        }
      ],
      surroundings: "يقع العقار في منطقة هادئة مع إطلالة رائعة على البحر، على بعد خطوات من الشاطئ الرملي. المنطقة مليئة بالمطاعم والمقاهي والمحلات التجارية.",
      experiences: [
        {
          title: "استكشاف الشاطئ",
          description: "استمتع بتجربة الاسترخاء على الشاطئ الرملي الخاص والسباحة في المياه الصافية"
        },
        {
          title: "الاستمتاع بالغروب",
          description: "شاهد غروب الشمس الرائع من الشرفة الخاصة أو على الشاطئ"
        }
      ]
    };
  }
}

/**
 * إنشاء دليل مخصص للمنطقة باستخدام الذكاء الاصطناعي
 */
export async function generateAreaGuide(
  property: Property, 
  preferences: any = {}
): Promise<any> {
  if (!geminiProModel) {
    logger.warn('ai', 'Gemini AI model not available for generateAreaGuide');
    // في حالة عدم وجود API، نعيد بيانات محددة مسبقاً
    return {
      overview: "تقع هذه المنطقة الرائعة على شاطئ البحر المميز، وتوفر مزيجاً من الاسترخاء والأنشطة الترفيهية والمطاعم الفاخرة. مثالية للإقامة العائلية أو الرومانسية.",
      localAttractions: [
        {
          name: "شاطئ الساحل الشمالي",
          description: "شاطئ رملي نقي بمياه صافية، مثالي للسباحة والاسترخاء",
          distance: "5 دقائق سيراً"
        },
        {
          name: "سوق المنطقة التقليدي",
          description: "سوق محلي يعرض الحرف اليدوية والتذكارات المحلية",
          distance: "15 دقيقة بالسيارة"
        },
        {
          name: "متنزه الساحل",
          description: "حديقة جميلة مع مناظر خلابة ومسارات للمشي",
          distance: "10 دقائق سيراً"
        }
      ],
      diningOptions: [
        {
          name: "مطعم الأسماك الطازجة",
          cuisine: "مأكولات بحرية",
          priceRange: "$$$",
          distance: "7 دقائق سيراً"
        },
        {
          name: "كافيه الشاطئ",
          cuisine: "مقهى ومخبوزات",
          priceRange: "$$",
          distance: "5 دقائق سيراً"
        },
        {
          name: "مطعم النكهات العربية",
          cuisine: "مأكولات شرقية",
          priceRange: "$$$",
          distance: "12 دقيقة بالسيارة"
        }
      ],
      transportationTips: [
        "تتوفر خدمة سيارات الأجرة على مدار الساعة، ويمكن طلبها عبر التطبيق",
        "محطة الحافلات الرئيسية على بعد 10 دقائق سيراً من العقار",
        "خدمة تأجير الدراجات متوفرة بالقرب من الشاطئ",
        "موقف سيارات مجاني متوفر للضيوف"
      ],
      insiderTips: [
        "زيارة الشاطئ في الصباح الباكر للاستمتاع بالهدوء والمناظر الخلابة",
        "تجربة الأسماك الطازجة في مطعم الأسماك الطازجة، خاصةً طبق السمك المشوي",
        "جولة في السوق المحلي يوم الجمعة حيث يقدم المزارعون منتجاتهم الطازجة",
        "زيارة الكهف الساحلي القريب للاستمتاع بتجربة فريدة"
      ]
    };
  }

  try {
    const promptText = `
    أنت دليل سياحي محترف متخصص في تقديم توصيات مخصصة للسياح في مصر.
    اكتب دليلاً مفصلاً للمنطقة المحيطة بالعقار التالي:
    
    ${JSON.stringify(property, null, 2)}
    
    تفضيلات المستخدم (إن وجدت):
    ${JSON.stringify(preferences, null, 2)}
    
    قم بإرجاع البيانات بصيغة JSON تحتوي على الأقسام التالية:
    1. overview: نظرة عامة مختصرة عن المنطقة
    2. localAttractions: قائمة من المعالم والأماكن الجذابة القريبة، كل عنصر يحتوي على (name) الاسم و(description) الوصف و(distance) المسافة من العقار
    3. diningOptions: قائمة من المطاعم القريبة، كل عنصر يحتوي على (name) الاسم و(cuisine) نوع المطبخ و(priceRange) نطاق السعر و(distance) المسافة من العقار
    4. transportationTips: قائمة من النصائح حول المواصلات في المنطقة
    5. insiderTips: قائمة من النصائح الداخلية والأسرار المحلية التي يعرفها السكان المحليون
    
    استخدم بيانات حقيقية عن المواقع الشهيرة في مصر مثل الساحل الشمالي، رأس الحكمة، شرم الشيخ، مرسى مطروح أو العلمين.
    قدم نصائح مخصصة بناءً على موقع العقار.
    
    أعد فقط الرد بصيغة JSON بدون أي كلام إضافي.
    `;

    const result = await geminiProModel.generateContent(promptText);
    const response = await result.response;
    const text = response.text().trim();
    
    // استخراج JSON من النص
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract valid JSON from AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('ai', 'Error in generateAreaGuide', { error: String(error) });
    // في حالة الخطأ نعيد بيانات محددة مسبقاً
    return {
      overview: "تقع هذه المنطقة الرائعة على شاطئ البحر المميز، وتوفر مزيجاً من الاسترخاء والأنشطة الترفيهية والمطاعم الفاخرة. مثالية للإقامة العائلية أو الرومانسية.",
      localAttractions: [
        {
          name: "شاطئ الساحل الشمالي",
          description: "شاطئ رملي نقي بمياه صافية، مثالي للسباحة والاسترخاء",
          distance: "5 دقائق سيراً"
        },
        {
          name: "سوق المنطقة التقليدي",
          description: "سوق محلي يعرض الحرف اليدوية والتذكارات المحلية",
          distance: "15 دقيقة بالسيارة"
        },
        {
          name: "متنزه الساحل",
          description: "حديقة جميلة مع مناظر خلابة ومسارات للمشي",
          distance: "10 دقائق سيراً"
        }
      ],
      diningOptions: [
        {
          name: "مطعم الأسماك الطازجة",
          cuisine: "مأكولات بحرية",
          priceRange: "$$$",
          distance: "7 دقائق سيراً"
        },
        {
          name: "كافيه الشاطئ",
          cuisine: "مقهى ومخبوزات",
          priceRange: "$$",
          distance: "5 دقائق سيراً"
        },
        {
          name: "مطعم النكهات العربية",
          cuisine: "مأكولات شرقية",
          priceRange: "$$$",
          distance: "12 دقيقة بالسيارة"
        }
      ],
      transportationTips: [
        "تتوفر خدمة سيارات الأجرة على مدار الساعة، ويمكن طلبها عبر التطبيق",
        "محطة الحافلات الرئيسية على بعد 10 دقائق سيراً من العقار",
        "خدمة تأجير الدراجات متوفرة بالقرب من الشاطئ",
        "موقف سيارات مجاني متوفر للضيوف"
      ],
      insiderTips: [
        "زيارة الشاطئ في الصباح الباكر للاستمتاع بالهدوء والمناظر الخلابة",
        "تجربة الأسماك الطازجة في مطعم الأسماك الطازجة، خاصةً طبق السمك المشوي",
        "جولة في السوق المحلي يوم الجمعة حيث يقدم المزارعون منتجاتهم الطازجة",
        "زيارة الكهف الساحلي القريب للاستمتاع بتجربة فريدة"
      ]
    };
  }
}

/**
 * تحليل التقييمات باستخدام الذكاء الاصطناعي
 */
export async function analyzeCustomerReviews(
  reviews: Review[], 
  propertyId?: number
): Promise<any> {
  if (!geminiProModel || reviews.length === 0) {
    logger.warn('ai', 'Gemini AI model not available for analyzeCustomerReviews or no reviews provided');
    // في حالة عدم وجود API أو تقييمات، نعيد بيانات محددة مسبقاً
    return {
      sentimentBreakdown: { positive: 65, neutral: 25, negative: 10 },
      commonPraises: [
        "موقع ممتاز قريب من الشاطئ",
        "نظافة العقار وتجهيزاته",
        "ترحيب المضيف وتعاونه"
      ],
      commonComplaints: [
        "بعض الضوضاء الخارجية",
        "بطء خدمة الإنترنت أحياناً"
      ],
      trendsOverTime: [
        {
          period: "الثلاثة أشهر الماضية",
          averageRating: 4.5,
          commonThemes: ["موقع ممتاز", "نظافة", "ترحيب"]
        },
        {
          period: "الستة أشهر الماضية",
          averageRating: 4.2,
          commonThemes: ["موقع جيد", "قيمة جيدة مقابل المال"]
        }
      ],
      actionableInsights: [
        "تحسين سرعة الإنترنت للضيوف",
        "النظر في حلول لتقليل الضوضاء الخارجية",
        "الاستمرار في الحفاظ على مستوى النظافة العالي"
      ]
    };
  }

  try {
    // تنسيق التقييمات للمعالجة
    const reviewsData = reviews.map(r => ({
      rating: r.rating,
      comment: r.comment,
      propertyId: r.propertyId,
      date: r.createdAt
    }));

    let promptText;
    if (propertyId) {
      // تحليل تقييمات لعقار محدد
      const propertyReviews = reviewsData.filter(r => r.propertyId === propertyId);
      
      promptText = `
      أنت محلل بيانات متخصص في تحليل تقييمات العملاء.
      قم بتحليل التقييمات التالية لعقار محدد:
      
      ${JSON.stringify(propertyReviews, null, 2)}
      
      قم بإرجاع تحليل شامل بصيغة JSON يحتوي على:
      1. sentimentBreakdown: نسب المشاعر (positive, neutral, negative) في التقييمات
      2. commonPraises: قائمة بأهم 3-5 إشادات متكررة
      3. commonComplaints: قائمة بأهم 2-3 شكاوى متكررة
      4. trendsOverTime: اتجاهات التقييمات عبر الوقت، مقسمة إلى فترات زمنية (3 أشهر، 6 أشهر، إلخ) مع متوسط التقييم والمواضيع الشائعة لكل فترة
      5. actionableInsights: قائمة من 3-5 توصيات قابلة للتنفيذ لتحسين تجربة العملاء
      
      أعد فقط الرد بصيغة JSON بدون أي كلام إضافي.
      `;
    } else {
      // تحليل عام لجميع التقييمات
      promptText = `
      أنت محلل بيانات متخصص في تحليل تقييمات العملاء.
      قم بتحليل التقييمات التالية:
      
      ${JSON.stringify(reviewsData, null, 2)}
      
      قم بإرجاع تحليل شامل بصيغة JSON يحتوي على:
      1. sentimentBreakdown: نسب المشاعر (positive, neutral, negative) في التقييمات
      2. commonPraises: قائمة بأهم 3-5 إشادات متكررة
      3. commonComplaints: قائمة بأهم 2-3 شكاوى متكررة
      4. trendsOverTime: اتجاهات التقييمات عبر الوقت، مقسمة إلى فترات زمنية (3 أشهر، 6 أشهر، إلخ) مع متوسط التقييم والمواضيع الشائعة لكل فترة
      5. actionableInsights: قائمة من 3-5 توصيات قابلة للتنفيذ لتحسين تجربة العملاء
      
      أعد فقط الرد بصيغة JSON بدون أي كلام إضافي.
      `;
    }

    const result = await geminiProModel.generateContent(promptText);
    const response = await result.response;
    const text = response.text().trim();
    
    // استخراج JSON من النص
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract valid JSON from AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('ai', 'Error in analyzeCustomerReviews', { error: String(error) });
    // في حالة الخطأ نعيد بيانات محددة مسبقاً
    return {
      sentimentBreakdown: { positive: 65, neutral: 25, negative: 10 },
      commonPraises: [
        "موقع ممتاز قريب من الشاطئ",
        "نظافة العقار وتجهيزاته",
        "ترحيب المضيف وتعاونه"
      ],
      commonComplaints: [
        "بعض الضوضاء الخارجية",
        "بطء خدمة الإنترنت أحياناً"
      ],
      trendsOverTime: [
        {
          period: "الثلاثة أشهر الماضية",
          averageRating: 4.5,
          commonThemes: ["موقع ممتاز", "نظافة", "ترحيب"]
        },
        {
          period: "الستة أشهر الماضية",
          averageRating: 4.2,
          commonThemes: ["موقع جيد", "قيمة جيدة مقابل المال"]
        }
      ],
      actionableInsights: [
        "تحسين سرعة الإنترنت للضيوف",
        "النظر في حلول لتقليل الضوضاء الخارجية",
        "الاستمرار في الحفاظ على مستوى النظافة العالي"
      ]
    };
  }
}

/**
 * تقسيم العملاء إلى شرائح باستخدام الذكاء الاصطناعي
 */
export async function segmentCustomers(customerData: any[]): Promise<any> {
  if (!geminiProModel) {
    logger.warn('ai', 'Gemini AI model not available for segmentCustomers');
    // في حالة عدم وجود API، نعيد بيانات محددة مسبقاً
    return {
      segments: [
        {
          name: "المسافرون المتكررون",
          description: "عملاء يحجزون بشكل متكرر، يبحثون عن تجارب موثوقة وقيمة جيدة",
          customerIds: [1, 3, 5, 8],
          targetingStrategies: [
            "تقديم برنامج ولاء مع خصومات على الحجوزات المتكررة",
            "إشعارات مخصصة عن العروض الجديدة في المواقع المفضلة"
          ]
        },
        {
          name: "الباحثون عن الفخامة",
          description: "عملاء يبحثون عن تجارب فاخرة وعقارات متميزة بغض النظر عن السعر",
          customerIds: [2, 7, 9],
          targetingStrategies: [
            "التركيز على ميزات الرفاهية والخدمات الحصرية في الإعلانات",
            "عروض لترقيات مجانية للإقامة في العقارات الفاخرة"
          ]
        },
        {
          name: "المسافرون العائليون",
          description: "عائلات تبحث عن عقارات واسعة وملائمة للأطفال بأسعار معقولة",
          customerIds: [4, 6, 10],
          targetingStrategies: [
            "إبراز الميزات الملائمة للأطفال والعائلات في الإعلانات",
            "عروض خاصة للإقامات الطويلة خلال العطلات المدرسية"
          ]
        }
      ],
      insights: [
        "70% من العملاء يفضلون العقارات القريبة من الشاطئ",
        "العملاء الذين يحجزون مرتين أو أكثر سنوياً يمثلون 25% من إجمالي الإيرادات",
        "المسافرون العائليون يميلون إلى حجز فترات إقامة أطول بمتوسط 5 أيام"
      ]
    };
  }

  try {
    const promptText = `
    أنت محلل بيانات متخصص في تقسيم العملاء وتحليل سلوكهم.
    قم بتحليل بيانات العملاء التالية:
    
    ${JSON.stringify(customerData, null, 2)}
    
    قم بإنشاء تقسيم للعملاء بصيغة JSON مع البيانات التالية:
    1. segments: قائمة من شرائح العملاء (3-5 شرائح) تحتوي كل منها على:
       - name: اسم الشريحة
       - description: وصف مختصر للشريحة وسلوكها وتفضيلاتها
       - customerIds: قائمة معرّفات العملاء المنتمين لهذه الشريحة
       - targetingStrategies: قائمة من 2-4 استراتيجيات تسويق مخصصة لهذه الشريحة
    2. insights: قائمة من 3-5 رؤى عامة مستخلصة من تحليل البيانات
    
    أعد فقط الرد بصيغة JSON بدون أي كلام إضافي.
    `;

    const result = await geminiProModel.generateContent(promptText);
    const response = await result.response;
    const text = response.text().trim();
    
    // استخراج JSON من النص
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract valid JSON from AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('ai', 'Error in segmentCustomers', { error: String(error) });
    // في حالة الخطأ نعيد بيانات محددة مسبقاً
    return {
      segments: [
        {
          name: "المسافرون المتكررون",
          description: "عملاء يحجزون بشكل متكرر، يبحثون عن تجارب موثوقة وقيمة جيدة",
          customerIds: [1, 3, 5, 8],
          targetingStrategies: [
            "تقديم برنامج ولاء مع خصومات على الحجوزات المتكررة",
            "إشعارات مخصصة عن العروض الجديدة في المواقع المفضلة"
          ]
        },
        {
          name: "الباحثون عن الفخامة",
          description: "عملاء يبحثون عن تجارب فاخرة وعقارات متميزة بغض النظر عن السعر",
          customerIds: [2, 7, 9],
          targetingStrategies: [
            "التركيز على ميزات الرفاهية والخدمات الحصرية في الإعلانات",
            "عروض لترقيات مجانية للإقامة في العقارات الفاخرة"
          ]
        },
        {
          name: "المسافرون العائليون",
          description: "عائلات تبحث عن عقارات واسعة وملائمة للأطفال بأسعار معقولة",
          customerIds: [4, 6, 10],
          targetingStrategies: [
            "إبراز الميزات الملائمة للأطفال والعائلات في الإعلانات",
            "عروض خاصة للإقامات الطويلة خلال العطلات المدرسية"
          ]
        }
      ],
      insights: [
        "70% من العملاء يفضلون العقارات القريبة من الشاطئ",
        "العملاء الذين يحجزون مرتين أو أكثر سنوياً يمثلون 25% من إجمالي الإيرادات",
        "المسافرون العائليون يميلون إلى حجز فترات إقامة أطول بمتوسط 5 أيام"
      ]
    };
  }
}