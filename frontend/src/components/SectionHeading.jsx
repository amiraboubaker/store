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
}) {
  const isCenter = align === 'center'

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
        className={`text-3xl md:text-4xl lg:text-5xl font-display font-medium leading-tight ${
          light ? 'text-white' : 'text-couture-espresso'
        }`}
      >
        {title}
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
