export const PRODUCT_CATEGORIES = {
  FABRICS: 'fabrics',
  THREADS: 'threads',
  NOTIONS: 'notions',
  PATTERNS: 'patterns',
  TOOLS: 'tools'
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;
