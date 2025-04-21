import { LiveTranslator } from '@/components/translation/LiveTranslator';
import { useTranslation } from '@/lib/i18n';

export default function TranslatePage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {t('translation.autoTranslate')}
      </h1>
      <p className="text-muted-foreground text-center mb-8">
        {t('home.hero.title')}
      </p>
      <LiveTranslator />
    </div>
  );
}