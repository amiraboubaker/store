import { useEffect, useRef, useState } from 'react'

/**
 * Reveal — animates its children into view on scroll using IntersectionObserver.
 * Reuses the `.reveal` utilities defined in index.css.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  direction = 'up',
  delay = 0,
  className = '',
  once = true,
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setShown(false)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const directionClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
        ? 'reveal-right'
        : direction === 'scale'
          ? 'reveal-scale'
          : ''

  return (
    <Tag
      ref={ref}
      className={`reveal ${directionClass} ${shown ? 'reveal-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
