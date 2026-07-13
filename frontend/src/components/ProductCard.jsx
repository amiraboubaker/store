import { Link } from 'react-router-dom'

function ProductCard({ product, loading = false }) {
  if (loading) {
    return (
      <div className="card overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-couture-linen" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-couture-linen rounded-none w-3/4" />
          <div className="h-3 bg-couture-linen rounded-none w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <Link to={`/products/${product.id}`} className="group card overflow-hidden block">
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
        <div className="absolute inset-0 bg-couture-espresso/0 group-hover:bg-couture-espresso/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-couture-espresso text-xs font-medium px-4 py-2 tracking-wider uppercase">
            Quick Preview
          </span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs text-couture-bark uppercase tracking-wider mb-2">{product.category}</p>
        <h3 className="font-display text-lg font-medium text-couture-espresso group-hover:text-couture-goldDark transition-colors">
          {product.name}
        </h3>
      </div>
    </Link>
  )
}

export default ProductCard
