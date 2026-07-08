# Product Management System for Couture Supplies

## API Endpoints

### Public
- GET /products?page=1&limit=10&category=Embroidery&material=Silk&minPrice=10&maxPrice=100
  - Returns paginated products with filtering.
- GET /products/:id
  - Returns a single product.

### Admin Only
- POST /products
  - Create a product.
- PUT /products/:id
  - Update a product.
- DELETE /products/:id
  - Delete a product.

## Product Schema

```json
{
  "id": 1,
  "name": "Silk Thread",
  "slug": "silk-thread",
  "price": 12.5,
  "category": "Embroidery",
  "material": "Silk",
  "stock": 10,
  "images": ["https://cdn.example.com/thread.jpg"],
  "description": "Premium silk thread for couture applications",
  "createdAt": "2026-07-07T00:00:00.000Z",
  "updatedAt": "2026-07-07T00:00:00.000Z"
}
```

## Storage Strategy
- Product metadata is stored in the database.
- Image URLs are stored as a JSON array on the product record.
- Images should be uploaded to a cloud or local object store and only the public URL should be persisted.

## Frontend Component Structure

```text
frontend/
  components/
    ProductCard.jsx
    ProductList.jsx
    ProductForm.jsx
    ProductFilters.jsx
    Pagination.jsx
  pages/
    AdminProductsPage.jsx
    ProductDetailsPage.jsx
  services/
    productService.js
```

## Validation Rules
- Price must be greater than 0.
- Stock must be greater than or equal to 0.
- Name, category, and description are required.
- Admin-only routes require authentication and an admin role.
