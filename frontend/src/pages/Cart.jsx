import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/helpers'
import PageBanner from '../components/PageBanner'
import { cart as initialCart } from '../data/products'

function Cart() {
  const [items, setItems] = useState(initialCart)
  const [removingId, setRemovingId] = useState(null)

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeItem = (id) => {
    setRemovingId(id)
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
      setRemovingId(null)
    }, 300)
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shipping = subtotal > 200 ? 0 : 15.00
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="section bg-white">
        <div className="container">
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-couture-taupe mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h1 className="text-3xl font-display font-medium text-couture-espresso mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-couture-bark mb-8">
              Looks like you haven't added any items yet.
            </p>
            <Link to="/products" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <PageBanner eyebrow="Shop" title="Shopping Cart" />
      <div className="section">
        <div className="container">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`card p-5 transition-all duration-300 ${
                    removingId === item.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div className="flex gap-5">
                    <div className="w-24 h-24 bg-couture-linen flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            to={`/products/${item.id}`}
                            className="font-display text-lg font-medium text-couture-espresso hover:text-couture-goldDark transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-couture-bark mt-1">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-couture-taupe hover:text-couture-bark transition-colors p-1"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-couture-linen">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1.5 text-couture-bark hover:text-couture-espresso transition-colors text-sm"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 py-1.5 min-w-[2.5rem] text-center text-couture-espresso font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1.5 text-couture-bark hover:text-couture-espresso transition-colors text-sm"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-couture-espresso">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display text-xl font-medium text-couture-espresso mb-6">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-couture-bark">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-couture-bark">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-couture-taupe">
                    Free shipping on orders over $200
                  </p>
                )}
                <div className="border-t border-couture-linen pt-3 flex justify-between font-semibold text-couture-espresso">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button className="btn btn-primary w-full mt-6">
                Proceed to Checkout
              </button>
              <Link
                to="/products"
                className="btn btn-ghost w-full mt-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
