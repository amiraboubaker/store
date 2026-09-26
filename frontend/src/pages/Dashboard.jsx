import { useState } from 'react'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('orders')

  const recentOrders = [
    { id: 'CS-2024-001', date: 'Nov 15, 2024', total: 127.50, status: 'Delivered', items: 3 },
    { id: 'CS-2024-002', date: 'Nov 20, 2024', total: 84.00, status: 'Shipped', items: 2 },
    { id: 'CS-2024-003', date: 'Nov 28, 2024', total: 245.00, status: 'Processing', items: 5 },
  ]

  const wishlistItems = [
    { name: 'Italian Silk Charmeuse', price: 45.00, image: '/assets/images/rayesmodes/image1.jpg' },
    { name: 'Hand-Dyed Organza', price: 32.00, image: '/assets/images/rayesmodes/Capture.png' },
  ]

  const tabs = [
    { id: 'orders', label: 'Orders' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'settings', label: 'Settings' },
  ]

  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-couture-sage/20 text-couture-sage'
      case 'Shipped':
        return 'bg-blue-100 text-blue-700'
      case 'Processing':
        return 'bg-couture-gold/20 text-couture-goldDark'
      default:
        return 'bg-couture-linen text-couture-bark'
    }
  }

  return (
    <div className="section bg-white">
      <div className="container">
        <h1 className="text-3xl md:text-4xl font-display font-medium text-couture-espresso mb-8">
          Your Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeTab === tab.id
                    ? 'bg-couture-espresso text-white'
                    : 'text-couture-bark hover:bg-couture-linen'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div>
                <h2 id="orders" className="font-display text-xl font-medium text-couture-espresso mb-6 group inline">
                  Order History
                  <a href="#orders" onClick={(e) => { e.preventDefault(); window.location.hash = 'orders' }} className="inline-flex items-center ml-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity align-middle text-couture-bark hover:text-couture-espresso" aria-label="Link to Order History">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </a>
                </h2>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="card p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-couture-espresso">
                            {order.id}
                          </p>
                          <p className="text-sm text-couture-bark">
                            {order.date} · {order.items} items
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-couture-espresso">
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h2 id="wishlist" className="font-display text-xl font-medium text-couture-espresso mb-6 group inline">
                  Saved Items
                  <a href="#wishlist" onClick={(e) => { e.preventDefault(); window.location.hash = 'wishlist' }} className="inline-flex items-center ml-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity align-middle text-couture-bark hover:text-couture-espresso" aria-label="Link to Saved Items">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </a>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlistItems.map((item) => (
                    <div key={item.name} className="card p-4">
                      <div className="aspect-square bg-couture-linen mb-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-display font-medium text-couture-espresso mb-1">
                        {item.name}
                      </h3>
                      <p className="text-couture-espresso font-semibold mb-4">
                        {formatPrice(item.price)}
                      </p>
                      <button className="btn btn-primary w-full text-sm py-2">
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 id="account-settings" className="font-display text-xl font-medium text-couture-espresso mb-6 group inline">
                  Account Settings
                  <a href="#account-settings" onClick={(e) => { e.preventDefault(); window.location.hash = 'account-settings' }} className="inline-flex items-center ml-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity align-middle text-couture-bark hover:text-couture-espresso" aria-label="Link to Account Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </a>
                </h2>
                <div className="card p-6 space-y-6 max-w-lg">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      defaultValue="user@example.com"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Display Name</label>
                    <input
                      type="text"
                      defaultValue="Jane Doe"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Shipping Address</label>
                    <textarea
                      className="input"
                      rows={3}
                      defaultValue="123 Fashion Ave, Paris, France"
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+33 1 23 45 67 89"
                      className="input"
                    />
                  </div>
                  <button className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
