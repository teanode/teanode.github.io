import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import { App } from './components/app'
import { initializeLanguage } from './components/language'
import { initializeTheme } from './components/theme'
import routes from './routes'

import { DocPage } from './pages/docPages'
import { NotFoundPage } from './pages/notFoundPages'
import { WelcomePage } from './pages/welcomePages'

// Before anything renders, so the page does not paint in one theme and then
// switch to the other.
initializeTheme()
initializeLanguage()

const container = document.getElementById('teanode')
if (!container) {
  throw new Error('the #teanode mount point is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          <Route path={routes.welcomePath} element={<WelcomePage/>}/>
          <Route path={routes.docsPath} element={<DocPage/>}/>
          <Route path={routes.docPath} element={<DocPage/>}/>
          <Route path='*' element={<NotFoundPage/>}/>
        </Routes>
      </App>
    </BrowserRouter>
  </StrictMode>,
)
