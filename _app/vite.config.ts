import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

// What the site fetches at runtime rather than imports: the document index,
// the documents themselves, and the pictures. They live at the repository
// root because that is what GitHub Pages serves, and the build never touches
// them. The dev server has to serve them from there too, or every document is
// a 404 on a laptop and fine in production.
const runtimeDirectories = ['/data/', '/media/']

const contentTypes: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.markdown': 'text/markdown; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
}

function serveRuntimeFiles(): Plugin {
  return {
    name: 'serve-runtime-files',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = (request.url ?? '').split('?')[0]
        if (!runtimeDirectories.some((directory) => url.startsWith(directory))) {
          next()
          return
        }
        // Resolved and then checked against the root, so a path with .. in it
        // cannot reach outside the repository.
        const file = path.resolve(ROOT, `.${decodeURIComponent(url)}`)
        if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          next()
          return
        }
        response.setHeader('Content-Type', contentTypes[path.extname(file)] ?? 'application/octet-stream')
        fs.createReadStream(file).pipe(response)
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  root: HERE,

  // The built site serves its assets from /static/, but the dev server serves
  // them from where it is asked for them, so the prefix is only right for a
  // build. Setting it for both makes every dev URL a 404.
  base: command === 'build' ? '/static/' : '/',

  plugins: [react(), yaml(), serveRuntimeFiles()],

  // Nothing is copied into the output: data/ and media/ are already where they
  // are served from.
  publicDir: false,

  build: {
    // Pinned rather than left to vite's own default, so that upgrading vite
    // cannot move the floor without a diff. There are no polyfills, so this is
    // the whole of the browser support promise.
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'],

    outDir: path.resolve(ROOT, 'static'),
    emptyOutDir: true,
    sourcemap: false,

    // Every asset as a file. Vite turns anything under 4kB into a data URI
    // otherwise, which would change how the small ones cache.
    assetsInlineLimit: 0,

    rollupOptions: {
      output: {
        // _bin/html.js finds the entry by this shape and deliberately ignores
        // anything called chunk, so the two must stay distinguishable.
        entryFileNames: 'teanode.[hash].js',
        chunkFileNames: 'chunk.[hash].js',
        assetFileNames: '[name].[hash:8][extname]',
      },
    },
  },

  server: {
    host: '127.0.0.1',
    port: 8890,
    strictPort: true,
    fs: {
      allow: [ROOT],
    },
  },
}))
