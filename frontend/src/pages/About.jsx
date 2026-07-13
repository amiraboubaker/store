import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Counter from '../components/Counter'
import PageBanner from '../components/PageBanner'
import { company, stats, clients, media } from '../data/company'

function About() {
  return (
    <div>
      <PageBanner
        eyebrow="About Us"
        title="Two Decades of Textile Craftsmanship"
        subtitle={company.about}
      />

      {/* Story + image */}
      < section className="section bg-white" >
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
                    <p className="font-display text-3xl font-semibold text-white">
                      {company.founded}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-white/70 mt-1">
                      Established
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal direction="left">
              <div>
                <SectionHeading
                  align="left"
                  eyebrow="Our Story"
                  title="Built on Expertise & Trust"
                  subtitle=""
                />
                <div className="space-y-4 text-couture-bark leading-relaxed">
                  <p>{company.aboutExtended}</p>
                  <p>
                    Founded by {company.founder} in {company.location}, we have
                    grown into a recognised manufacturer of home textiles,
                    trusted by clients across the globe.
                  </p>
                  <p className="text-couture-espresso font-medium">
                    {company.clientsNote}
                  </p>
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
      </section >

      {/* Stats band */}
      < section className="bg-couture-espresso" >
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
      </section >

      {/* Trusted clients */}
      < section className="section bg-white" >
        <div className="container">
          <SectionHeading
            eyebrow="Trusted By"
            title="Brands That Choose Us"
            subtitle="We are proud to manufacture for some of the most respected names in fashion and hospitality."
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
      </section >

      {/* CTA */}
      < section className="section bg-white border-t border-couture-linen" >
        <div className="container text-center">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-couture-espresso mb-4">
              Discover our capabilities
            </h2>
            <p className="text-couture-bark max-w-xl mx-auto mb-8">
              Explore the full production cycle we offer, from design to
              delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services" className="btn btn-primary">
                Our Services
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                Contact Us
              </Link>
            </div>
          </Reveal>
        </div>
      </section >
    </div >
  )
}

export default About
