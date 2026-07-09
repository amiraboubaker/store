export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}
