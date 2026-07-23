import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import { products } from '../data/products'
import { useLanguage } from '../context/LanguageContext'

function ProductDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { t } = useLanguage()

  const product = products.find((p) => p.id === id)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [id])

  if (loading) {
    return (
      <div className="section bg-white">
        <div className="container"><Loading count={1} /></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="section bg-white">
        <div className="container">
          <ErrorState message={!product ? t('detail_not_found') : t('detail_failed')} />
        </div>
      </div>
    )
  }

  return (
    <div className="section bg-white">
      <div className="container">
        <nav className="flex items-center space-x-2 text-sm text-couture-bark mb-8">
          <Link to="/" className="hover:text-couture-espresso">{t('detail_home')}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-couture-espresso">{t('detail_products')}</Link>
          <span>/</span>
          <span className="text-couture-espresso">{t(product.nameKey)}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="aspect-[4/3] bg-couture-linen overflow-hidden">
            <img src={product.image} alt={t(product.nameKey)} className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col">
            <p className="text-sm text-couture-bark uppercase tracking-widest mb-3">{t(product.categoryKey)}</p>
            <h1 className="text-3xl md:text-4xl font-display font-medium text-couture-espresso mb-4">{t(product.nameKey)}</h1>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-couture-gold' : 'text-couture-linen'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-couture-bark">{product.rating} {t('detail_rating')}</span>
            </div>

            <p className="text-couture-bark leading-relaxed mb-8">{t(product.descKey)}</p>

            <div className="space-y-3 mb-8 text-sm">
              <div className="flex">
                <span className="w-32 text-couture-bark">{t('detail_material')}</span>
                <span className="text-couture-espresso">{t(product.materialKey)}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-couture-bark">{t('detail_weight')}</span>
                <span className="text-couture-espresso">{t(product.weightKey)}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-couture-bark">{t('detail_width')}</span>
                <span className="text-couture-espresso">{t(product.widthKey)}</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="label mb-3">{t('detail_colors')}</p>
              <div className="flex flex-wrap gap-3">
                {product.colorKeys.map((colorKey) => (
                  <span
                    key={colorKey}
                    className="px-4 py-2 border border-couture-linen text-sm text-couture-espresso"
                  >
                    {t(colorKey)}
                  </span>
                ))}
              </div>
            </div>

            <Link to="/contact" className="btn btn-primary inline-block">
              {t('detail_enquire')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
