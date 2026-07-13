import { useEffect, useRef, useState } from 'react'

/**
 * Counter — counts up to `end` the first time it scrolls into view.
 */
export default function Counter({ end, duration = 2000, suffix = '', label, light = false }) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <div ref={ref} className="text-center">
      <div
        className={`font-display text-4xl md:text-5xl font-semibold ${
          light ? 'text-white' : 'text-couture-espresso'
        }`}
      >
        {value}
        {suffix}
      </div>
      {label && (
        <div
          className={`mt-2 text-xs md:text-sm uppercase tracking-widest ${
            light ? 'text-white/70' : 'text-couture-bark'
          }`}
        >
          {label}
        </div>
      )}
    </div>
  )
}
