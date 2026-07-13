import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Counter from '../components/Counter'
import { products } from '../data/products'
import { services, stats, clients, media } from '../data/company'
import { useLanguage } from '../context/LanguageContext'

const previewServices = services.slice(0, 3)

function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const featuredProducts = products.filter((p) => p.featured)

  return (
    <div>
      <section className="relative overflow-hidden bg-couture-espresso">
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{ backgroundImage: `url(${media.heroImage})` }}
        />
        <div className="absolute inset-0 bg-couture-espresso/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-couture-espresso/85 via-couture-espresso/45 to-transparent" />

        <div className="container section relative min-h-[45vh] md:min-h-[55vh] flex items-center">
          <div className="max-w-2xl animate-slide-up [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-widest text-couture-goldLight mb-4">
              {t('home_eyebrow')}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-white leading-tight mb-6 text-balance">
              {t('home_hero_title')}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
              {t('home_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="btn btn-primary">
                {t('home_shop_collection')}
              </Link>
              <Link
                to="/products?category=Fabric"
                className="btn border border-white text-white hover:bg-white hover:text-couture-espresso"
              >
                {t('home_explore_fabrics')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-couture-espresso py-6 overflow-hidden marquee-paused">
        <div className="marquee-track flex items-center gap-12 whitespace-nowrap w-max">
          {[...clients, ...clients].map((client, i) => (
            <span key={i} className="font-display text-lg text-white/60 tracking-wide">
              {client}
            </span>
          ))}
        </div>
      </div>

      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-medium text-couture-espresso mb-4">
              {t('home_curated_title')}
            </h2>
            <p className="text-couture-bark max-w-2xl mx-auto">
              {t('home_curated_subtitle')}
            </p>
          </div>

          {loading ? (
            <Loading count={3} />
          ) : error ? (
            <ErrorState onRetry={() => setError(false)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredProducts.slice(0, 3).map((product, i) => (
                <Reveal key={product.id} delay={i * 100}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products" className="btn btn-secondary">
              {t('home_view_all')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section bg-white border-t border-couture-linen">
        <div className="container">
          <SectionHeading
            eyebrow={t('home_services_eyebrow')}
            title={t('home_services_title')}
            subtitle={t('home_services_subtitle')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {previewServices.map((service, i) => (
              <Reveal key={service.id} delay={i * 100}>
                <div className="card h-full p-7 hover-lift group">
                  <div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-white p-3 group-hover:bg-couture-espresso transition-colors duration-300">
                    <img src={service.image} alt={service.title} loading="lazy" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-couture-espresso mb-3">{service.title}</h3>
                  <p className="text-sm text-couture-bark leading-relaxed">{service.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/services" className="btn btn-primary">
              {t('home_explore_services')}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-couture-espresso">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <Counter key={stat.label} end={stat.value} suffix={stat.suffix} label={stat.label} light />
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-couture-linen">
                <svg className="w-6 h-6 text-couture-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium text-couture-espresso mb-2">{t('home_shipping_title')}</h3>
              <p className="text-sm text-couture-bark">{t('home_shipping_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-couture-linen">
                <svg className="w-6 h-6 text-couture-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium text-couture-espresso mb-2">{t('home_certified_title')}</h3>
              <p className="text-sm text-couture-bark">{t('home_certified_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-couture-linen">
                <svg className="w-6 h-6 text-couture-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium text-couture-espresso mb-2">{t('home_curation_title')}</h3>
              <p className="text-sm text-couture-bark">{t('home_curation_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-white border-t border-couture-linen">
        <div className="container">
          <Reveal>
            <div className="bg-couture-espresso text-white p-10 md:p-16 text-center">
              <h2 className="text-2xl md:text-4xl font-display font-medium mb-4 text-balance">
                {t('home_cta_title')}
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8">{t('home_cta_subtitle')}</p>
              <Link to="/contact" className="btn bg-white text-couture-espresso hover:bg-couture-gold hover:text-white">
                {t('home_cta_btn')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default Home
