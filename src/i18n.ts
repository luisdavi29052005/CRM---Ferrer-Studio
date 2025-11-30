import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: false,
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/translation.json',
        }
    });

// Async IP detection to override if no local storage is set
const detectIpLanguage = async () => {
    // If user has already selected a language (stored in localStorage), respect it
    const cachedLng = localStorage.getItem('i18nextLng');
    if (cachedLng) return;

    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const detectedLng = data.country_code === 'BR' ? 'pt' : 'en';

        if (detectedLng && detectedLng !== i18n.language) {
            i18n.changeLanguage(detectedLng);
        }
    } catch (error) {
        console.error('Failed to detect country from IP:', error);
    }
};

detectIpLanguage();

export default i18n;
