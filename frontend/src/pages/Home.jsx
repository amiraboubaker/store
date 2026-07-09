import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import { products } from '../data/products'

function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const featuredProducts = products.filter((p) => p.featured)

  return (
    <div>
      <section className="relative bg-couture-ivory border-b border-couture-linen">
        <div className="container section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <p className="text-sm text-couture-bark uppercase tracking-widest mb-4">
                Premium Couture Supplies
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-couture-espresso leading-tight mb-6 text-balance">
                Fabrics & Trims for the Modern Atelier
              </h1>
              <p className="text-lg text-couture-bark leading-relaxed mb-8 max-w-lg">
                Sourced from the world's finest mills. European silks, Japanese cottons, 
                and hand-selected notions for your most ambitious creations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products" className="btn btn-primary">
                  Shop Collection
                </Link>
                <Link to="/products?category=Fabric" className="btn btn-secondary">
                  Explore Fabrics
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <img
                src="https://images.unsplash.com/photo-1558171813-4c088753afef?w=800&h=600&fit=crop"
                alt="Luxurious silk fabric"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-couture-cream">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-medium text-couture-espresso mb-4">
              Curated Collection
            </h2>
            <p className="text-couture-bark max-w-2xl mx-auto">
              Every material in our collection is hand-selected for its quality, 
              provenance, and suitability for haute couture construction.
            </p>
          </div>

          {loading ? (
            <Loading count={3} />
          ) : error ? (
            <ErrorState onRetry={() => setError(false)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products" className="btn btn-secondary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="section bg-couture-ivory border-t border-couture-linen">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-couture-linen">
                <svg className="w-6 h-6 text-couture-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium text-couture-espresso mb-2">
                Worldwide Shipping
              </h3>
              <p className="text-sm text-couture-bark">
                Express delivery to over 60 countries with climate-controlled transport.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-couture-linen">
                <svg className="w-6 h-6 text-couture-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium text-couture-espresso mb-2">
                Certified Authenticity
              </h3>
              <p className="text-sm text-couture-bark">
                Every bolt and spool comes with a certificate of origin and quality.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-couture-linen">
                <svg className="w-6 h-6 text-couture-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium text-couture-espresso mb-2">
                Expert Curation
              </h3>
              <p className="text-sm text-couture-bark">
                Curated by professional couturiers with decades of industry experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
