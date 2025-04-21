import { GoogleGenerativeAI } from '@google/generative-ai';

// التحقق من وجود مفتاح API لـ Gemini
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Translation services will not be available.');
}

// تهيئة نموذج Gemini للترجمة إذا كان المفتاح متوفرًا
let translationModel: any = null;

try {
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    translationModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('Gemini translation model initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Gemini translation model:', error);
}

export const geminiTranslationModel = translationModel;