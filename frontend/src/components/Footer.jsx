import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-couture-espresso text-couture-linen mt-auto">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-semibold text-white mb-3">Rayes Modes</h3>
            <p className="text-sm text-couture-taupe max-w-md leading-relaxed">{t('footer_desc')}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">{t('footer_shop')}</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_all_products')}</Link></li>
              <li><Link to="/products?category=Fabric" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_fabrics')}</Link></li>
              <li><Link to="/products?category=Trims" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_trims')}</Link></li>
              <li><Link to="/products?category=Notions" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_notions')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">{t('footer_company')}</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_about')}</Link></li>
              <li><Link to="/services" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_services')}</Link></li>
              <li><Link to="/contact" className="text-sm text-couture-taupe hover:text-white transition-colors">{t('footer_contact')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-couture-coffee mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-couture-bark">{t('footer_rights')}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="text-sm text-couture-bark">{t('footer_privacy')}</span>
            <span className="text-sm text-couture-bark">{t('footer_terms')}</span>
            <span className="text-sm text-couture-bark">{t('footer_accessibility')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
