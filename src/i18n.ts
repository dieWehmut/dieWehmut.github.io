import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';
import zh_tw from './locales/zh_tw.json';
import ja from './locales/ja.json';
import de from './locales/de.json';
import la from './locales/la.json';

const messages = {
  en,
  zh,
  zh_tw,
  ja,
  de,
  la,
};

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null;
const defaultLocale = saved || 'en';

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages,
});

export default i18n;
