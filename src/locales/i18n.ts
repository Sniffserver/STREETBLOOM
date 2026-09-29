import { et } from './et';
import { en } from './en';

export type Language = 'et' | 'en';

export const translations = { et, en };

export function getTranslation(lang: Language) {
  return translations[lang] || translations.et;
}
