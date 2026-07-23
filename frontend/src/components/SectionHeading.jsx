/**
 * SectionHeading — consistent eyebrow + title + accent divider + subtitle.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  light = false,
  className = '',
  id: headingId,
}) {
  const isCenter = align === 'center'
  const id = headingId || (typeof title === 'string' ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : '')

  return (
    <div className={`max-w-2xl ${isCenter ? 'mx-auto text-center' : 'text-left'} mb-10 md:mb-14 ${className}`}>
      {eyebrow && (
        <p
          className={`text-sm uppercase tracking-widest mb-3 ${
            light ? 'text-couture-gold' : 'text-couture-bark'
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id || undefined}
        className={`text-3xl md:text-4xl lg:text-5xl font-display font-medium leading-tight group ${
          light ? 'text-white' : 'text-couture-espresso'
        }`}
      >
        {title}
        {id && (
          <a
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = id
            }}
            className={`inline-flex items-center ml-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity align-middle ${
              light ? 'text-white/60 hover:text-white' : 'text-couture-bark hover:text-couture-espresso'
            }`}
            aria-label={`Link to ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </a>
        )}
      </h2>
      <div
        className={`h-1 w-16 bg-couture-gold mt-5 mb-5 ${isCenter ? 'mx-auto' : ''}`}
      />
      {subtitle && (
        <p className={light ? 'text-white/70 leading-relaxed' : 'text-couture-bark leading-relaxed'}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
