import { createStore } from 'stan-js';
import fr from './fr.json';
import kab from './kab.json';

const dictionaries: Record<string, any> = { fr, kab };

const { useStore, store } = createStore({
  selectedLanguage: 'kab' as 'fr' | 'kab',
});

const translate = (lang: 'fr' | 'kab', key: string, data?: Record<string, any>): string => {
  const dictionary = dictionaries[lang] || dictionaries['kab'];
  const keys = key.split('.');
  let result = dictionary;
  for (const k of keys) {
    result = result?.[k];
    if (!result) break;
  }
  if (typeof result !== 'string') return key;
  if (data) {
    return result.replace(/{{(.*?)}}/g, (match, p1) => {
      const keyFound = p1.trim();
      return data[keyFound] !== undefined ? String(data[keyFound]) : match;
    });
  }
  return result;
};

export function useAppTranslation() {
  const { selectedLanguage } = useStore();
  const currentLang = selectedLanguage || 'kab';
  const t = (key: string, data?: Record<string, any>) => translate(currentLang, key, data);
  const setLanguage = (lang: 'fr' | 'kab') => {
    store.selectedLanguage = lang;
  };

  return { t, currentLang, setLanguage };
}
