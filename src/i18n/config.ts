import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import vi from '../locales/vi.json';

// Bundled translations — always available immediately, no async HTTP fetch.
// This prevents the "missing label text" bug on Windows 7 + older browsers
// where the service worker takes control before i18next-http-backend finishes loading.
const bundledResources = { vi: { translation: vi } };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: bundledResources,
    fallbackLng: 'vi',
    lng: 'vi', // Default language - Vietnamese
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    react: {
      // false = render without waiting for translations (prevents blank screens on slow/fresh load)
      useSuspense: false,
    },
  });

export default i18n;
