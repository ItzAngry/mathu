import sv from './sv'
import en from './en'

export const locales = { sv, en }
export const defaultLocale = 'sv'

export function getTranslations(lang = 'sv') {
  return locales[lang] ?? locales.sv
}
