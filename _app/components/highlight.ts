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

// What a block with no language named can be taken for. Most of the
// documents write their commands and files as indented blocks with no fence
// label, so without a guess almost nothing would be coloured. The guess is
// confined to the few grammars those blocks actually are, and a block the
// detector is not sure about is printed plain rather than coloured wrongly:
// a DNS record or a table of output has no grammar, and painting it as one
// is worse than leaving it alone.
const guessable = ['bash', 'yaml', 'ini', 'json', 'go', 'sql']

// How sure the detector has to be. highlight.js scores a match by how much of
// the text its grammar recognised; below this a short block of prose-like
// output can score as shell because it contains a word shell knows.
const minimumRelevance = 6

// Nothing back for a fence naming a grammar that is not registered, or for a
// block the detector cannot place, so the caller escapes the block and prints
// it plain rather than colouring it as a guess.
export const highlight = (code: string, language?: string): string => {
  if (language) {
    return hljs.getLanguage(language) ? hljs.highlight(code, { language, ignoreIllegals: true }).value : ''
  }
  const guess = hljs.highlightAuto(code, guessable)
  return guess.language && guess.relevance >= minimumRelevance ? guess.value : ''
}
