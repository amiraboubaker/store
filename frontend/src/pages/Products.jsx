import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import PageBanner from '../components/PageBanner'
import { products, categories } from '../data/products'
import { useLanguage } from '../context/LanguageContext'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { t } = useLanguage()

  const categoryParam = searchParams.get('category') || 'All'

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const filteredProducts = useMemo(() => {
    if (categoryParam === 'All') return products
    return products.filter((p) => p.category === categoryParam)
  }, [categoryParam])

  const handleCategoryChange = (category) => {
    if (category === 'All') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', category)
    }
    setSearchParams(searchParams)
  }

  return (
    <div className="bg-white">
      <PageBanner eyebrow={t('products_eyebrow')} title={t('products_title')} subtitle={t('products_subtitle')} />
      <div className="section">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2 text-sm tracking-wide transition-all ${
                  categoryParam === category
                    ? 'bg-couture-espresso text-white'
                    : 'bg-white border border-couture-linen text-couture-bark hover:border-couture-espresso hover:text-couture-espresso'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading count={9} />
          ) : error ? (
            <ErrorState onRetry={() => setError(false)} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-couture-bark">{t('products_not_found')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Products
