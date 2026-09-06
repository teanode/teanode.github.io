import hljs from 'highlight.js/lib/core'

import bash from 'highlight.js/lib/languages/bash'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

// Only the languages the documents actually fence. The full highlight.js build
// is about a megabyte of grammars for languages this site has never had a
// reason to print; adding one is two lines here plus the fence label.
const languages = { bash, diff, dockerfile, go, graphql, http, ini, json, sql, xml, yaml }

for (const name of Object.keys(languages) as (keyof typeof languages)[]) {
  hljs.registerLanguage(name, languages[name])
}

// `html` and `shell` are what somebody reaches for; highlight.js answers to
// the other name for each.
hljs.registerAliases(['html'], { languageName: 'xml' })
hljs.registerAliases(['shell', 'sh', 'console'], { languageName: 'bash' })
hljs.registerAliases(['env', 'dotenv'], { languageName: 'ini' })

// Nothing back for a fence with no language, or one naming a grammar that is
// not registered, so the caller escapes the block and prints it plain rather
// than colouring it as a guess.
export const highlight = (code: string, language?: string): string => {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value
  }
  return ''
}
