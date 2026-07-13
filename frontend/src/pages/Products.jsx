import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import { products, categories } from '../data/products'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
    <div className="section bg-white">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-medium text-couture-espresso mb-4">
            Our Collection
          </h1>
          <p className="text-couture-bark max-w-2xl mx-auto">
            Browse our selection of premium fabrics, trims, and notions.
          </p>
        </div>

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
                <p className="text-couture-bark">No products found in this category.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Products
