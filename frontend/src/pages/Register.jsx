import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function Register() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError(t('auth_passwords_mismatch'))
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-couture-espresso mb-6">{t('auth_register')}</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">{t('auth_first_name')}</label>
              <input id="firstName" name="firstName" type="text" required value={form.firstName} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="lastName" className="label">{t('auth_last_name')}</label>
              <input id="lastName" name="lastName" type="text" required value={form.lastName} onChange={handleChange} className="input" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="label">{t('contact_email')}</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">{t('auth_password')}</label>
            <input id="password" name="password" type="password" required minLength={6} value={form.password} onChange={handleChange} className="input" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">{t('auth_confirm_password')}</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange} className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? '...' : t('auth_register')}
          </button>
        </form>
        <p className="mt-4 text-sm text-couture-bark text-center">
          {t('auth_have_account')}{' '}
          <Link to="/login" className="text-couture-espresso underline">{t('auth_login')}</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
