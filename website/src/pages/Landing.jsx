import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar    from '../components/Navbar'
import Footer    from '../components/Footer'
import Hero      from '../sections/Hero'
import About     from '../sections/About'
import Services  from '../sections/Services'
import Pricing   from '../sections/Pricing'
import Download  from '../sections/Download'
import Contact   from '../sections/Contact'

const ROUTE_TO_SECTION = {
  '/features': 'services',
  '/pricing':  'pricing',
  '/download': 'download',
  '/contact':  'contact',
}

export default function Landing() {
  const { pathname } = useLocation()

  useEffect(() => {
    const sectionId = ROUTE_TO_SECTION[pathname]
    if (sectionId) {
      // small delay to let DOM render
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Pricing />
        <Download />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
