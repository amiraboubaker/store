import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-couture-espresso text-couture-linen mt-auto">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-semibold text-white mb-3">
              Rayes Modes
            </h3>
            <p className="text-sm text-couture-taupe max-w-md leading-relaxed">
              Premium fabrics, trims, and notions for the discerning maker.
              Sourced from the world's finest ateliers, delivered to your studio.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
              Catalogue
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=Fabric" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  Fabrics
                </Link>
              </li>
              <li>
                <Link to="/products?category=Trims" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  Trims
                </Link>
              </li>
              <li>
                <Link to="/products?category=Notions" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  Notions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-couture-taupe hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-couture-coffee mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-couture-bark">
            &copy; 2026 Rayes Modes. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-sm text-couture-bark">Privacy</span>
            <span className="text-sm text-couture-bark">Terms</span>
            <span className="text-sm text-couture-bark">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
