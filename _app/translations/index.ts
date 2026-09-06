import enTranslation from './en.yaml'
import jaTranslation from './ja.yaml'
import zhTranslation from './zh.yaml'

// The name is the language's own name, read from the file it names, so adding
// a language means adding a file and one line here. English first: it is the
// fallback for a key the others lack.
export default [
  { name: String(enTranslation.language), code: 'en', translation: enTranslation },
  { name: String(zhTranslation.language), code: 'zh', translation: zhTranslation },
  { name: String(jaTranslation.language), code: 'ja', translation: jaTranslation },
]
