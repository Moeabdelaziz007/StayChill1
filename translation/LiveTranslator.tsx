import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const languages = [
  { code: 'ar', name: 'العربية', nameLatin: 'Arabic' },
  { code: 'en', name: 'English', nameLatin: 'English' },
  { code: 'fr', name: 'Français', nameLatin: 'French' },
  { code: 'de', name: 'Deutsch', nameLatin: 'German' },
  { code: 'es', name: 'Español', nameLatin: 'Spanish' },
  { code: 'it', name: 'Italiano', nameLatin: 'Italian' },
  { code: 'ru', name: 'Русский', nameLatin: 'Russian' },
];

export function LiveTranslator() {
  const { t, locale } = useTranslation();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState(locale);
  const [targetLang, setTargetLang] = useState(locale === 'ar' ? 'en' : 'ar');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceText(e.target.value);
    setError(null);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError(t('translation.enterText'));
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/translate', {
        text: sourceText,
        sourceLang,
        targetLang
      });

      const data = await response.json();
      
      if (response.ok) {
        setTranslatedText(data.translatedText);
      } else {
        setError(data.error || 'Translation failed');
        console.error('Translation error:', data);
      }
    } catch (err) {
      console.error('Translation request error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  // هذه الوظيفة تعرض الاسم المناسب للغة بناءً على لغة واجهة المستخدم الحالية
  const getLanguageDisplay = (langCode: string) => {
    const lang = languages.find(l => l.code === langCode);
    if (!lang) return langCode;
    
    return locale === 'ar' ? lang.name : lang.nameLatin;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-center">{t('translation.autoTranslate')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('translation.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {getLanguageDisplay(lang.code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder={t('translation.enterText')}
              className="min-h-[200px] resize-none"
              value={sourceText}
              onChange={handleSourceChange}
              dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <div className="flex flex-col justify-center items-center">
            <Button 
              variant="outline" 
              size="icon"
              onClick={swapLanguages}
              className="my-2"
              disabled={isTranslating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
              </svg>
              <span className="sr-only">Swap languages</span>
            </Button>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('translation.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {getLanguageDisplay(lang.code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder={t('translation.translatedTextWillAppearHere')}
              className="min-h-[200px] resize-none"
              value={translatedText}
              readOnly
              dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm py-1">{error}</div>
        )}
        
        <div className="flex justify-center">
          <Button 
            onClick={handleTranslate} 
            disabled={isTranslating || !sourceText.trim()}
            className="w-full md:w-auto"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('translation.translating')}
              </>
            ) : (
              t('translation.autoTranslate')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}