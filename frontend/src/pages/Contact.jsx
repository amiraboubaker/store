import { useState } from 'react'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import PageBanner from '../components/PageBanner'
import { contact } from '../data/company'
import { useLanguage } from '../context/LanguageContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function validate(form, t) {
  const errors = {}
  if (!form.name.trim()) errors.name = t('contact_err_name')
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('contact_err_email')
  if (!form.message.trim() || form.message.trim().length < 10) errors.message = t('contact_err_message')
  return errors
}

function ContactInfoCard({ icon, label, value, href }) {
  const content = (
    <div className="flex items-start space-x-4">
      <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center border border-couture-linen text-couture-espresso">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-couture-bark mb-1">{label}</p>
        <p className="text-couture-espresso font-medium">{value}</p>
      </div>
    </div>
  )

  return href ? (
    <a href={href} className="block hover:opacity-70 transition-opacity">{content}</a>
  ) : content
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validate(form, t)
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return }
    setLoading(true)
    setServerError('')
    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const text = await res.text()
        let data = {}
        try { data = JSON.parse(text) } catch {}
        console.error('Contact save failed:', res.status, text)
        setServerError(data.errors?.[0]?.msg || data.message || t('contact_err_server'))
        return
      }

      const data = await res.json().catch(() => ({}))
      console.log('Contact stored:', data.data)
      setSent(true)
    } catch (error) {
      console.error('Contact submit error:', error)
      setServerError(t('contact_err_server'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageBanner
        eyebrow={t('contact_eyebrow')}
        title={t('contact_title')}
        subtitle={t('contact_subtitle')}
      />

      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
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
                      {t('contact_sent_title')}
                    </h2>
                    <p className="text-couture-bark mb-6">
                      {t('contact_sent_subtitle')} {form.name || 'friend'}. {t('contact_sent_note')}
                    </p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                      className="btn btn-secondary"
                    >
                      {t('contact_send_another')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {serverError && <p className="text-red-600 text-sm">{serverError}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="label">{t('contact_name')}</label>
                        <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className="input" placeholder={t('contact_name_placeholder')} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="email" className="label">{t('contact_email')}</label>
                        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder={t('contact_email_placeholder')} />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="label">{t('contact_subject')}</label>
                      <input id="subject" name="subject" type="text" value={form.subject} onChange={handleChange} className="input" placeholder={t('contact_subject_placeholder')} />
                    </div>
                    <div>
                      <label htmlFor="message" className="label">{t('contact_message')}</label>
                      <textarea id="message" name="message" rows={5} value={form.message} onChange={handleChange} className="input resize-none" placeholder={t('contact_message_placeholder')} />
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                      {loading ? '...' : t('contact_send')}
                    </button>
                  </form>
                )}
              </div>
            </Reveal>

            <Reveal direction="left" className="space-y-8">
              <div className="space-y-6">
                <ContactInfoCard
                  label={t('contact_address')}
                  value={t('contact_address_value')}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <ContactInfoCard
                  label={t('contact_phone')}
                  value={contact.phone}
                  href={contact.phoneHref}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                />
                <ContactInfoCard
                  label={t('contact_email')}
                  value={contact.email}
                  href={contact.emailHref}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
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
