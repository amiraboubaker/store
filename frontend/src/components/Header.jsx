import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { media } from '../data/company'

function Header() {
  const [cartCount, setCartCount] = useState(3)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const location = useLocation()

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

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-couture-linen transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''
        }`}
    >
      {/* Animated scroll-progress bar */}
      <div
        className="absolute top-0 left-0 h-0.5 bg-couture-gold transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-display text-xl md:text-2xl font-semibold text-couture-espresso tracking-tight">
              Rayes Modes
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative text-sm tracking-wide transition-colors py-1 ${isActive(item.path)
                  ? 'text-couture-espresso font-medium'
                  : 'text-couture-bark hover:text-couture-espresso'
                  }`}
              >
                {item.name}
                <span
                  className={`absolute left-0 -bottom-0.5 h-px bg-couture-gold transition-all duration-300 ${isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              to="/cart"
              className="relative p-2 text-couture-bark hover:text-couture-espresso transition-colors"
              aria-label="Shopping cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-couture-espresso text-white text-xs font-medium">
                  {cartCount}
                </span>
              )}
            </Link>

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
                className={`block py-3 text-sm tracking-wide transition-colors ${isActive(item.path)
                  ? 'text-couture-espresso font-medium'
                  : 'text-couture-bark'
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
