# Shopping Cart System

## Overview

The shopping cart system supports authenticated user carts stored in the database and guest carts stored in browser localStorage. All price calculations and stock validations are performed server-side.

## Cart Schema

### Database Model

**Table:** `Carts`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique cart identifier |
| `userId` | INTEGER | NOT NULL, UNIQUE, INDEXED | Foreign key to `Users.id` |
| `items` | JSON | NOT NULL, DEFAULT `[]` | Array of cart item objects |
| `createdAt` | DATETIME | | Record creation timestamp |
| `updatedAt` | DATETIME | | Record last update timestamp |

### Cart Item Structure

Each element in the `items` JSON array follows this shape:

```json
{
  "productId": 1,
  "name": "Silk Ribbon",
  "quantity": 2,
  "unitPrice": 12.50,
  "stock": 8
}
```

| Field | Type | Description |
|-------|------|-------------|
| `productId` | INTEGER | Product identifier |
| `name` | STRING | Product name (snapshot at add time) |
| `quantity` | INTEGER | Positive integer quantity |
| `unitPrice` | DECIMAL | Price per unit snapshot at add time |
| `stock` | INTEGER | Available stock at add time |

### Guest Cart (localStorage)

Guest carts are not stored server-side. The frontend persists them in `localStorage`:

```json
[
  { "productId": 1, "quantity": 2 },
  { "productId": 5, "quantity": 1 }
]
```

Only `productId` and `quantity` are stored. Names, prices, and stock are resolved server-side during merge or validation.

---

## API Endpoints

All cart endpoints require authentication (`Bearer` token) except guest cart operations which are handled client-side.

### 1. Get Cart

**Endpoint:** `GET /cart`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "CART_RETRIEVED",
  "message": "Cart retrieved successfully",
  "data": {
    "userId": 1,
    "items": [
      {
        "productId": 1,
        "name": "Silk Ribbon",
        "quantity": 2,
        "unitPrice": 12.50,
        "stock": 8,
        "lineTotal": 25.00
      }
    ],
    "itemCount": 2,
    "subtotal": "25.00",
    "total": "25.00"
  }
}
```

### 2. Add Item to Cart

**Endpoint:** `POST /cart/items`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "code": "CART_ITEM_ADDED",
  "message": "Item added to cart",
  "data": {
    "userId": 1,
    "items": [...],
    "itemCount": 2,
    "subtotal": "25.00",
    "total": "25.00"
  }
}
```

**Error Responses:**
- `400 Bad Request` — `INVALID_QUANTITY`: Quantity must be a positive integer
- `400 Bad Request` — `INVALID_PRODUCT_ID`: Product ID must be a positive integer
- `404 Not Found` — `PRODUCT_NOT_FOUND`: Product does not exist
- `409 Conflict` — `OUT_OF_STOCK`: Requested quantity exceeds available stock

### 3. Update Cart Item Quantity

**Endpoint:** `PUT /cart/items/:productId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quantity": 5
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "CART_ITEM_UPDATED",
  "message": "Cart item updated",
  "data": {
    "userId": 1,
    "items": [...],
    "itemCount": 5,
    "subtotal": "62.50",
    "total": "62.50"
  }
}
```

**Error Responses:**
- `400 Bad Request` — `INVALID_QUANTITY`
- `400 Bad Request` — `INVALID_PRODUCT_ID`
- `404 Not Found` — `CART_ITEM_NOT_FOUND`: Item is not in the cart
- `404 Not Found` — `PRODUCT_NOT_FOUND`
- `409 Conflict` — `OUT_OF_STOCK`

### 4. Remove Cart Item

**Endpoint:** `DELETE /cart/items/:productId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "CART_ITEM_REMOVED",
  "message": "Cart item removed",
  "data": {
    "userId": 1,
    "items": [],
    "itemCount": 0,
    "subtotal": "0.00",
    "total": "0.00"
  }
}
```

**Error Responses:**
- `400 Bad Request` — `INVALID_PRODUCT_ID`

### 5. Clear Cart

**Endpoint:** `DELETE /cart`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "CART_CLEARED",
  "message": "Cart cleared",
  "data": {
    "userId": 1,
    "items": [],
    "itemCount": 0,
    "subtotal": "0.00",
    "total": "0.00"
  }
}
```

### 6. Login with Guest Cart Merge

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "guestCart": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 1 }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "LOGIN_SUCCESS",
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "firstName": "John", "lastName": "Doe", "email": "user@example.com", "role": "customer" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cart": {
      "userId": 1,
      "items": [...],
      "itemCount": 3,
      "subtotal": "45.00",
      "total": "45.00"
    }
  }
}
```

---

## State Management Logic

### Server-Side: CartService

**File:** `src/services/CartService.js`

The `CartService` is the single source of truth for cart state. It enforces all business rules and recalculates totals from the database on every operation.

#### Core Methods

| Method | Purpose |
|--------|---------|
| `getOrCreateCart(userId)` | Fetch existing cart or create empty cart for user |
| `getCart(userId)` | Return serialized cart with server-calculated totals |
| `addItem(userId, productId, quantity)` | Add item or increment quantity if already in cart |
| `updateItem(userId, productId, quantity)` | Set exact quantity for existing cart item |
| `removeItem(userId, productId)` | Delete item from cart |
| `mergeGuestCart(userId, guestItems)` | Merge localStorage guest items into user cart on login |
| `clearCart(userId)` | Remove all items from cart |
| `serializeCart(cart)` | Reconcile cart with current product data and return totals |

#### Validation Rules

1. **Product ID normalization** — `normalizeProductId(value)` converts input to a positive integer. Rejects strings, floats, zero, and negative numbers with `INVALID_PRODUCT_ID`.
2. **Quantity normalization** — `normalizeQuantity(value)` converts input to a positive integer. Rejects non-integers, zero, and negative numbers with `INVALID_QUANTITY`.
3. **Product existence** — Every mutating operation (`addItem`, `updateItem`, `mergeGuestCart`) fetches the product from the database before modifying the cart. Missing products return `PRODUCT_NOT_FOUND`.
4. **Stock validation** — Stock is checked before adding or updating. If requested quantity exceeds `product.stock`, the operation returns `OUT_OF_STOCK` (409). During merge, out-of-stock guest items are silently skipped.

#### Totals Calculation

`serializeCart` always recalculates `unitPrice` from the live `Product.price` column. Cached prices stored in the cart JSON are used only as fallbacks for deleted products.

```javascript
static calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return {
        subtotal: Number(subtotal.toFixed(2)),
        total: Number(subtotal.toFixed(2)),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
}
```

#### Deduplication

Cart items are keyed by `productId`. `addItem` and `mergeGuestCart` use `findIndex` to locate existing entries. If found, the quantity is incremented rather than creating a duplicate entry.

### Client-Side: Guest Cart State

For unauthenticated users, the cart lives in `localStorage`:

```javascript
// Storage key
const GUEST_CART_KEY = 'guest_cart';

// Structure
[
  { "productId": 1, "quantity": 2 }
]
```

#### Recommended Guest Cart Operations

```javascript
// Read guest cart
const getGuestCart = () => {
    try {
        return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    } catch {
        return [];
    }
};

// Add/update item in guest cart
const setGuestCartItem = (productId, quantity) => {
    const cart = getGuestCart();
    const existing = cart.find(item => Number(item.productId) === Number(productId));
    if (existing) {
        existing.quantity = quantity;
    } else {
        cart.push({ productId: Number(productId), quantity });
    }
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

// Remove item from guest cart
const removeGuestCartItem = (productId) => {
    const cart = getGuestCart().filter(item => Number(item.productId) !== Number(productId));
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

// Clear guest cart
const clearGuestCart = () => localStorage.removeItem(GUEST_CART_KEY);
```

#### Login Sync Flow

1. User clicks login with items in `localStorage`.
2. Frontend reads `guestCart` array.
3. Frontend sends `POST /auth/login` with `email`, `password`, and `guestCart`.
4. Server authenticates user, then calls `CartService.mergeGuestCart(userId, guestCart)`.
5. Server returns merged cart with server-calculated totals.
6. Frontend stores returned cart in application state and clears `localStorage`.

### One Cart Per User

The database enforces a unique constraint on `userId`, ensuring each user has exactly one cart record. This prevents duplicate carts and simplifies retrieval.

---

## Security & Edge Cases

| Scenario | Handling |
|----------|----------|
| Frontend sends manipulated prices | Server ignores client prices; recalculates from `Product.price` |
| Negative or zero quantity | Rejected by `normalizeQuantity` before any DB operation |
| Out-of-stock product | Rejected with `OUT_OF_STOCK` (409) on add/update; skipped during merge |
| Deleted product still in cart | `serializeCart` falls back to stored snapshot data |
| Duplicate product IDs in request | Each product ID is normalized and deduplicated server-side |
| Guest cart merge with existing user cart | Quantities are summed per product, capped by stock |
| Cart lost on refresh | Authenticated: persisted in DB. Guest: persisted in `localStorage`. |
| Empty cart | Returns `items: []`, `subtotal: "0.00"`, `total: "0.00"` |
