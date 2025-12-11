import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'vi',
    lng: 'vi', // Default language - Vietnamese
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    backend: {
      loadPath: '/src/i18n/locales/{{lng}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
