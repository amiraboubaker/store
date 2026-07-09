import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatPrice } from '../utils/helpers'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import { products } from '../data/products'

function ProductDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const product = products.find((p) => p.id === id)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setQuantity(1)

    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [id])

  if (loading) {
    return (
      <div className="section bg-couture-cream">
        <div className="container">
          <Loading count={1} />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="section bg-couture-cream">
        <div className="container">
          <ErrorState message={!product ? 'Product not found.' : 'Failed to load product.'} />
        </div>
      </div>
    )
  }

  return (
    <div className="section bg-couture-cream">
      <div className="container">
        <nav className="flex items-center space-x-2 text-sm text-couture-bark mb-8">
          <Link to="/" className="hover:text-couture-espresso">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-couture-espresso">Products</Link>
          <span>/</span>
          <span className="text-couture-espresso">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="aspect-[4/3] bg-couture-linen overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-sm text-couture-bark uppercase tracking-widest mb-3">
              {product.category}
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-medium text-couture-espresso mb-4">
              {product.name}
            </h1>

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
              <span className="text-sm text-couture-bark">{product.rating} out of 5</span>
            </div>

            <p className="text-2xl font-semibold text-couture-espresso mb-6">
              {formatPrice(product.price)}
            </p>

            <p className="text-couture-bark leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="space-y-3 mb-8 text-sm">
              <div className="flex">
                <span className="w-32 text-couture-bark">Material</span>
                <span className="text-couture-espresso">{product.material}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-couture-bark">Weight</span>
                <span className="text-couture-espresso">{product.weight}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-couture-bark">Width</span>
                <span className="text-couture-espresso">{product.width}</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="label mb-3">Available Colors</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <span
                    key={color}
                    className="px-4 py-2 border border-couture-linen text-sm text-couture-espresso hover:border-couture-espresso transition-colors cursor-pointer"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center border border-couture-linen">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-couture-bark hover:text-couture-espresso transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 py-3 min-w-[3rem] text-center text-couture-espresso font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-couture-bark hover:text-couture-espresso transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button className="flex-1 btn btn-primary">
                Add to Cart
              </button>
            </div>

            {product.inStock ? (
              <p className="text-sm text-couture-sage flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                In Stock
              </p>
            ) : (
              <p className="text-sm text-couture-bark">Out of Stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
