# Intended API contracts

These endpoints are a design target, not implemented API behavior. C# DTO files are empty. JSON examples describe the contract you will implement.

## Catalog

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/health` | HTTP 200 with `Healthy` |
| GET | `/api/products?q=&category=&sort=featured&inStock=false&page=1&pageSize=6` | Paged products |
| GET | `/api/products/{id}` | One product or 404 Problem Details |
| GET | `/api/categories` | Available category names |

Sort values: `featured`, `price-low`, `price-high`, `name`. Page must be a positive integer; page size is 1–50. Category names are case-sensitive in this initial contract. Validate query inputs.

```json
{
  "items": [
    {
      "id": 1,
      "name": "Mechanical Keyboard",
      "description": "Tactile switches, a compact layout and a warm desk glow.",
      "price": 349.90,
      "stock": 12,
      "category": "Workspace",
      "kind": "keyboard",
      "color": "#e8eddf",
      "featured": true
    }
  ],
  "page": 1,
  "pageSize": 6,
  "totalItems": 9,
  "totalPages": 2
}
```

Detail returns a single product object with the same fields. Illustration kinds: `keyboard`, `headphones`, `backpack`, `lamp`, `mouse`, `bottle`. Colors are six-digit hex values. Prices are BRL decimals; stock is a nonnegative integer.

## Identity and account

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Anonymous; validated name/email/password |
| POST | `/api/auth/login` | Anonymous; email/password; established session |
| POST | `/api/auth/logout` | Current session |
| GET | `/api/account` | Authenticated user's public profile |
| PUT | `/api/account` | Authenticated user's validated profile update |

A public customer response contains `id`, `name`, `email`, and only the roles the frontend needs. It never contains a password or hash. Choose session/antiforgery details before wiring the real frontend; the current demo validates fictional passwords locally but has no login endpoints and never saves those passwords.

## Orders

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/orders` | Authenticated customer in the first implementation |
| GET | `/api/orders` | Current customer's orders only |
| GET | `/api/orders/{id}` | Owner or authorized administrator |

Creation body:

```json
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "delivery": {
    "name": "Alex Example",
    "email": "alex@example.com",
    "postalCode": "01001-000",
    "street": "123 Example Street",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

Use an `Idempotency-Key` header for one checkout attempt. Compute prices, shipping and totals on the server. The demo shipping rule is R$25 below R$500 and free from R$500; document any change in one central business rule. Return HTTP 201 with a Location header for a newly created order. Define the replay response consistently (for example HTTP 200 and the existing order).

An order detail includes `id`, `createdAt` (UTC ISO 8601), `status`, `items`, `subtotal`, `shipping`, `total`, `delivery`. Each item includes `productId`, `name`, `price` and `quantity` captured at purchase time. Status values: `Confirmed`, `Preparing`, `Shipped`. The server must validate allowed status transitions. Order summaries can omit the delivery address.

The frontend currently supports guest demo orders. This is local UX only; implementing guest access to real orders would need a separate ownership/access design.

## Administration

| Method | Route | Result |
| --- | --- | --- |
| POST | `/api/admin/products` | Create validated product; HTTP 201 |
| PUT | `/api/admin/products/{id}` | Update product; documented conflict behavior |
| DELETE | `/api/admin/products/{id}` | Remove/archive product without deleting historical order snapshots |
| GET | `/api/admin/orders` | Paged orders visible to an administrator |
| PATCH | `/api/admin/orders/{id}/status` | Validate and update order status |

Require an administrator policy for every route above. Product write fields mirror the product contract except the server assigns `id`. Constraints: nonempty name up to 100 characters, description up to 1,000, positive decimal price, integer stock ≥0, supported category/kind and hex color. Do not allow callers to choose ownership/roles through ordinary DTOs.

The optional server cart controller is reserved for a later authenticated cart. It is not required while the browser cart sends validated items at checkout. The contact page is a local form demonstration and does not imply a messaging API.

## Consistent errors

Use `application/problem+json`. Document 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (missing), 409 (stock/concurrency/idempotency conflict). Validation responses can include field-specific `errors` for Angular to display. Do not expose stack traces, connection strings or password information.
