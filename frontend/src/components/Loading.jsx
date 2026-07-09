import ProductCard from './ProductCard'

function Loading({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCard key={i} loading />
      ))}
    </div>
  )
}

export default Loading
