import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
]

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const location = useLocation()
  const { lang, setLang, t } = useLanguage()

  const currentLang = LANGUAGES.find((l) => l.code === lang)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setScrolled(window.scrollY > 8)
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { name: t('nav_home'), path: '/' },
    { name: t('nav_about'), path: '/about' },
    { name: t('nav_products'), path: '/products' },
    { name: t('nav_services'), path: '/services' },
    { name: t('nav_contact'), path: '/contact' },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-couture-linen transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}
    >
      <div
        className="absolute top-0 left-0 h-0.5 bg-couture-gold transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-x-2">
            <img src="/assets/images/icogam/logo.png" alt="Rayes Modes" className="h-10 md:h-12 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative text-sm tracking-wide transition-colors py-1 ${
                  isActive(item.path)
                    ? 'text-couture-espresso font-medium'
                    : 'text-couture-bark hover:text-couture-espresso'
                }`}
              >
                {item.name}
                <span
                  className={`absolute left-0 -bottom-0.5 h-px bg-couture-gold transition-all duration-300 ${
                    isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-x-3">
            {/* Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-x-1.5 px-2.5 py-1.5 text-sm text-couture-bark hover:text-couture-espresso border border-transparent hover:border-couture-linen transition-all"
                aria-label="Select language"
              >
                <span className="font-medium">{currentLang.label}</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1 w-fit min-w-[4rem] bg-white border border-couture-linen shadow-md z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false) }}
                      className={`w-full flex items-center justify-center px-3 py-2 text-sm transition-colors ${
                        lang === l.code
                          ? 'bg-couture-linen text-couture-espresso font-medium'
                          : 'text-couture-bark hover:bg-couture-linen/50 hover:text-couture-espresso'
                      }`}
                    >
                      <span className="font-medium">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="lg:hidden p-2 text-couture-bark hover:text-couture-espresso"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-couture-linen animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 text-sm tracking-wide transition-colors ${
                  isActive(item.path) ? 'text-couture-espresso font-medium' : 'text-couture-bark'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
