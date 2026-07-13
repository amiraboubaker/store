import { useState } from 'react'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import PageBanner from '../components/PageBanner'
import { contact } from '../data/company'

function ContactInfoCard({ icon, label, value, href }) {
  const content = (
    <div className="flex items-start space-x-4">
      <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center border border-couture-linen text-couture-espresso">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-couture-bark mb-1">
          {label}
        </p>
        <p className="text-couture-espresso font-medium">{value}</p>
      </div>
    </div>
  )

  return href ? (
    <a href={href} className="block hover:opacity-70 transition-opacity">
      {content}
    </a>
  ) : (
    content
  )
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div>
      <PageBanner
        eyebrow="Contact"
        title="Let's Create Together"
        subtitle="Whether you have a ready project or just an idea, our team is here to help you bring it to life."
      />

      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form */}
            <Reveal direction="right">
              <div className="card p-7 md:p-10">
                {sent ? (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-couture-sage/20 text-couture-sage mb-4">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="font-display text-2xl font-medium text-couture-espresso mb-2">
                      Message Sent
                    </h2>
                    <p className="text-couture-bark mb-6">
                      Thank you, {form.name || 'friend'}. We'll get back to you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false)
                        setForm({ name: '', email: '', subject: '', message: '' })
                      }}
                      className="btn btn-secondary"
                    >
                      Send Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="label">Name</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          className="input"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="label">Email</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          className="input"
                          placeholder="you@studio.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="label">Subject</label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        value={form.subject}
                        onChange={handleChange}
                        className="input"
                        placeholder="Project enquiry"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="label">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={form.message}
                        onChange={handleChange}
                        className="input resize-none"
                        placeholder="Tell us about your project..."
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </Reveal>

            {/* Info + map */}
            <Reveal direction="left" className="space-y-8">
              <div className="space-y-6">
                <ContactInfoCard
                  label="Address"
                  value={contact.address}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <ContactInfoCard
                  label="Phone"
                  value={contact.phone}
                  href={contact.phoneHref}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                />
                <ContactInfoCard
                  label="Email"
                  value={contact.email}
                  href={contact.emailHref}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                {/* <ContactInfoCard
                  label="LinkedIn"
                  value="Follow our company"
                  href={contact.linkedin}
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z" />
                    </svg>
                  }
                /> */}
              </div>

              <div className="border border-couture-linen overflow-hidden aspect-[4/3] sm:aspect-[16/10]">
                <iframe
                  title="ICOGAM location map"
                  src={contact.mapSrc}
                  className="w-full h-full"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
