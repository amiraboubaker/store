import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Counter from '../components/Counter'
import PageBanner from '../components/PageBanner'
import { company, stats, clients, media } from '../data/company'
import { useLanguage } from '../context/LanguageContext'

function About() {
  const { t } = useLanguage()

  return (
    <div>
      <PageBanner
        eyebrow={t('about_eyebrow')}
        title={t('about_title')}
        subtitle={company.about}
      />

      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <div className="relative">
                <img
                  src={media.aboutImage}
                  alt="ICOGAM textile production"
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute -bottom-6 -right-6 hidden md:flex bg-couture-espresso text-white p-6 shadow-lg">
                  <div>
                    <p className="font-display text-3xl font-semibold text-white">{company.founded}</p>
                    <p className="text-xs uppercase tracking-widest text-white/70 mt-1">{t('about_established')}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal direction="left">
              <div>
                <SectionHeading
                  align="left"
                  eyebrow={t('about_story_eyebrow')}
                  title={t('about_story_title')}
                  subtitle=""
                />
                <div className="space-y-4 text-couture-bark leading-relaxed">
                  <p>{company.aboutExtended}</p>
                  <p>
                    Founded by {company.founder} in {company.location}, we have
                    grown into a recognised manufacturer of home textiles,
                    trusted by clients across the globe.
                  </p>
                  <p className="text-couture-espresso font-medium">{company.clientsNote}</p>
                </div>
                <img
                  src={media.captureImage}
                  alt="ICOGAM atelier detail"
                  loading="lazy"
                  className="mt-6 w-full aspect-[16/9] object-cover"
                />
              </div>
            </Reveal>
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
          <SectionHeading
            eyebrow={t('about_trusted_eyebrow')}
            title={t('about_trusted_title')}
            subtitle={t('about_trusted_subtitle')}
          />
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 items-center">
              {clients.map((client) => (
                <div
                  key={client}
                  className="text-center font-display text-lg text-couture-bark/70 hover:text-couture-espresso transition-colors px-2"
                >
                  {client}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-white border-t border-couture-linen">
        <div className="container text-center">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-couture-espresso mb-4">
              {t('about_cta_title')}
            </h2>
            <p className="text-couture-bark max-w-xl mx-auto mb-8">{t('about_cta_subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services" className="btn btn-primary">{t('about_our_services')}</Link>
              <Link to="/contact" className="btn btn-secondary">{t('about_contact_us')}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default About
