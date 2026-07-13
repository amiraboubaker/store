export default function PageBanner({ eyebrow, title, subtitle }) {
  return (
    <section className="bg-couture-espresso text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,theme(colors.couture.gold),transparent_55%)]" />
      <div className="container py-14 md:py-20 relative">
        {eyebrow && (
          <p className="text-sm uppercase tracking-widest mb-3 text-white/70">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium leading-tight mb-4 max-w-3xl text-balance">
          {title}
        </h1>
        <div className="h-1 w-16 bg-couture-gold mt-4" />
        {subtitle && (
          <p className="mt-5 text-lg leading-relaxed max-w-2xl text-white/80">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
