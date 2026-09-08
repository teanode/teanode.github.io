import { useEffect } from 'react'
import { useLocation } from 'react-router'

// gtag.js is loaded from index.html and configured with send_page_view false,
// because this is a single page app: only the first load would ever be counted
// otherwise. Every route change, including the first, is reported here instead.
export const Analytics = () => {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') {
      return
    }
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [location.pathname, location.search])

  return null
}
