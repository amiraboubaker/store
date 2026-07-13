import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Counter from '../components/Counter'
import PageBanner from '../components/PageBanner'
import { services, productRange, stats, company } from '../data/company'

function Services() {
  return (
    <div>
      <PageBanner
        eyebrow="What We Do"
        title="End-to-End Textile Manufacturing"
        subtitle="From the first sketch to the final quality check, our integrated atelier guides your project through every stage of production with precision and care."
      />

      {/* Services grid */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Our Services"
            title="A Complete Production Cycle"
            subtitle="Each step is handled in-house by specialised teams, giving you a single, reliable partner for your textile collections."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, i) => (
              <Reveal key={service.id} delay={(i % 3) * 100}>
                <div className="card h-full p-7 hover-lift group">
                  <div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-white p-3 group-hover:bg-couture-espresso transition-colors duration-300">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-display text-xl font-medium text-couture-espresso mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-couture-bark leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product range */}
      <section className="section bg-white border-t border-couture-linen">
        <div className="container">
          <SectionHeading
            eyebrow="Our Product Range"
            title="What We Manufacture"
            align="center"
          />
          <Reveal>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
              {productRange.map((item) => (
                <span
                  key={item}
                  className="px-5 py-3 bg-white border border-couture-linen text-couture-espresso text-sm tracking-wide hover:border-couture-gold transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-couture-espresso">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <Counter
                key={stat.label}
                end={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                light
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-white">
        <div className="container">
          <Reveal>
            <div className="card p-10 md:p-14 text-center bg-white">
              <h2 className="text-2xl md:text-3xl font-display font-medium text-couture-espresso mb-4">
                Ready to start your next collection?
              </h2>
              <p className="text-couture-bark max-w-xl mx-auto mb-8">
                {company.clientsNote}
              </p>
              <Link to="/contact" className="btn btn-primary">
                Get in Touch
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default Services
