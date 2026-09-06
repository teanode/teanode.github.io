import { useEffect } from 'react'
import { useLocation } from 'react-router'

// teanode.github.io serves the same site as teanode.com, and cannot be
// redirected to it: CloudFront uses it as the origin, so a redirect there
// would send the origin fetch back round to the front. Both hostnames are
// therefore crawlable copies of the same pages, and this is what says which
// address is the real one. robots.txt cannot, since one file is served by
// both hosts.
//
// It is set here rather than written into index.html because the served HTML
// is the same bytes for every route.
const site = 'https://teanode.com'

export const Canonical = () => {
  const location = useLocation()

  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    // The path only. Nothing here reads a query string, so one appended by
    // whatever carried the link is not part of the address of the page.
    link.setAttribute('href', site + location.pathname)
  }, [location.pathname])

  return null
}
