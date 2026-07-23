import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Counter from '../components/Counter'
import PageBanner from '../components/PageBanner'
import { services, productRangeKeys, stats, company } from '../data/company'
import { useLanguage } from '../context/LanguageContext'

function Services() {
  const { t } = useLanguage()

  return (
    <div>
      <PageBanner
        eyebrow={t('services_eyebrow')}
        title={t('services_title')}
        subtitle={t('services_subtitle')}
      />

      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow={t('services_section_eyebrow')}
            title={t('services_section_title')}
            subtitle={t('services_section_subtitle')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, i) => (
              <Reveal key={service.id} delay={(i % 3) * 100}>
                <div className="card h-full p-7 hover-lift group">
                  <div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-white p-3 group-hover:bg-couture-espresso transition-colors duration-300">
                    <img src={service.image} alt={t(service.titleKey)} loading="lazy" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-couture-espresso mb-3">{t(service.titleKey)}</h3>
                  <p className="text-sm text-couture-bark leading-relaxed">{t(service.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white border-t border-couture-linen">
        <div className="container">
          <SectionHeading
            eyebrow={t('services_range_eyebrow')}
            title={t('services_range_title')}
            align="center"
          />
          <Reveal>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
              {productRangeKeys.map((key) => (
                <span
                  key={key}
                  className="px-5 py-3 bg-white border border-couture-linen text-couture-espresso text-sm tracking-wide hover:border-couture-gold transition-colors"
                >
                  {t(key)}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-couture-espresso">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <Counter key={stat.labelKey} end={stat.value} suffix={stat.suffix} label={t(stat.labelKey)} light />
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <Reveal>
            <div className="card p-10 md:p-14 text-center bg-white">
              <h2 className="text-2xl md:text-3xl font-display font-medium text-couture-espresso mb-4">
                {t('services_cta_title')}
              </h2>
              <p className="text-couture-bark max-w-xl mx-auto mb-8">{t('company_clients_note')}</p>
              <Link to="/contact" className="btn btn-primary">{t('services_cta_btn')}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default Services
