import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/helpers'

function ProductCard({ product, loading = false }) {
  if (loading) {
    return (
      <div className="card overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-couture-linen" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-couture-linen rounded-none w-3/4" />
          <div className="h-3 bg-couture-linen rounded-none w-1/2" />
          <div className="h-6 bg-couture-linen rounded-none w-1/4" />
        </div>
      </div>
    )
  }

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="card overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-couture-linen">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.featured && (
            <span className="absolute top-3 left-3 bg-couture-espresso text-white text-xs font-medium px-3 py-1 tracking-wider uppercase">
              Featured
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs text-couture-bark uppercase tracking-wider mb-2">
            {product.category}
          </p>
          <h3 className="font-display text-lg font-medium text-couture-espresso mb-2 group-hover:text-couture-goldDark transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-couture-espresso">
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-couture-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-couture-bark">{product.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
