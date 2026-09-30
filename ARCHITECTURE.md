# Easy Food Architecture Details

This document provides an in-depth look at the architecture, design patterns, data flows, and technical decisions that power the **Easy Food** platform. 

---

## 1. System Overview

Easy Food is a unified platform catering to three primary user types:
1. **Customers**: Can browse food courts, place orders across multiple vendors, pay via UPI, and track their tokens.
2. **Vendors**: Can manage their specific stall's menu, verify incoming UPI payments, and update order statuses via a realtime dashboard.
3. **Admins**: Can oversee the entire food court, onboard new vendors, and moderate user accounts.

The platform is designed as a **Monorepo** using npm workspaces, ensuring that types and schemas are strictly shared across the stack.

---

## 2. Directory Structure & Monorepo

The codebase is organized into isolated workspaces to enforce modular boundaries.

```text
teaandS/
├── apps/
│   ├── frontend/         # React SPA (Vite + TanStack)
│   └── backend/          # Node.js API (Express + Socket.io)
├── packages/
│   └── shared/           # Cross-boundary types & utilities
├── package.json          # Root workspace configuration
└── ARCHITECTURE.md       # You are here
```

### `packages/shared`
The `shared` package is critical for preventing drift between the frontend and backend. It exports:
- **TypeScript Interfaces**: `User`, `PublicOrder`, `Vendor`, `Product`, etc.
- **Zod Schemas**: Used by the backend to validate incoming payloads and by the frontend for form validation.
- **Enums & Constants**: Order statuses (`Pending`, `Preparing`, `Ready`), Role definitions (`admin`, `vendor`, `customer`).

---

## 3. Frontend Architecture (apps/frontend)

The frontend is a Single Page Application (SPA) prioritizing type safety, performance, and responsive design.

### Core Stack
- **Framework**: React 19 + Vite.
- **Routing**: **TanStack Router**. We use code-based/file-based routing that generates a fully typed route tree (`routeTree.gen.ts`).
  - **Layout Groups**: Pathless layouts like `(auth)`, `(legal)`, and `(main)` isolate route logic without cluttering the URL structure.
  - **Dashboard Isolation**: `/admin` and `/vendor` routes dynamically hide the consumer-facing `Header` and `BottomNav` to present an isolated, app-like dashboard view.
- **State Management**:
  - **Server State**: **TanStack Query (React Query)** handles data fetching, caching, background refetching, and pagination.
  - **Client State**: **Zustand** is used for synchronous local state, such as managing the global Shopping Cart. The Cart strictly enforces that a user can only add items from a single vendor stall at a time.
- **API Client**: A customized **Axios** instance (`apiClient.ts`).
  - Implements a response interceptor to automatically catch `401 Unauthorized` errors, call the `/refresh` token endpoint, and seamlessly replay the failed request.
- **Styling**: **Tailwind CSS v4** combined with `lucide-react` for iconography and Radix UI for accessible primitives (modals, dropdowns, etc.).

---

## 4. Backend Architecture (apps/backend)

The backend is built on **Node.js and Express**, using **MongoDB** as the persistence layer.

### Core Stack
- **Server**: Express.js with `cookie-parser` and `cors` for session management.
- **Database**: MongoDB via **Mongoose**.
- **Realtime**: **Socket.io** handles real-time bidirectional event streaming.
- **Push Notifications**: Firebase Admin SDK interacts with Firebase Cloud Messaging (FCM).

### Architectural Pattern
The backend enforces a strict **Controller-Service-Route** separation of concerns:
1. **Routes (`/src/routes`)**: Define API paths, apply authentication/RBAC middleware, and pass execution to controllers.
2. **Controllers (`/src/controllers`)**: Parse incoming request parameters, query strings, and body payloads (validating via Zod), call the appropriate Service, and handle HTTP responses (200 OK, 400 Bad Request).
3. **Services (`/src/services`)**: Contain pure business logic and database interactions. They emit Socket.io events and trigger Push Notifications.
4. **Standardized Messages (`/src/constants/messages.ts`)**: All API response messages and errors are strictly centralized here to ensure consistent messaging across all routes, controllers, and services.

---

## 5. Data Flow: Placing an Order

The system's most complex flow is the lifecycle of an order. Here is the step-by-step data flow:

1. **Cart & Checkout**: The user builds a cart locally (Zustand). The cart logic enforces a single-vendor policy. Upon checkout, they upload a UPI payment screenshot.
2. **API Request**: The frontend calls `POST /api/orders` via Axios. The payload includes customer details and the screenshot file (handled via Multer).
3. **Database Creation**: The `OrderService` validates the stock and confirms all items belong to a single vendor. It calculates totals, saves the `Order` document in MongoDB with an initial status of `New`, and generates a daily Token number.
4. **Realtime Broadcast**: 
   - `socket.io` emits a `new-order` event specifically to the "room" belonging to the target `vendorId`.
   - The Vendor's live dashboard instantly updates without a page refresh.
5. **Background Push Notification**: Firebase Admin SDK pushes an FCM notification to the vendor's registered devices.

---

## 6. Authentication & Authorization Flow

Easy Food relies on a highly secure JWT (JSON Web Token) approach utilizing HttpOnly cookies.

1. **Login**: User submits credentials. Backend verifies password (bcrypt) and generates two tokens:
   - **Access Token**: Short-lived (e.g., 15 minutes), sent back in the JSON body, stored in frontend memory.
   - **Refresh Token**: Long-lived (e.g., 7 days), securely attached as an `HttpOnly`, `Secure`, `SameSite` cookie.
2. **Authenticated Requests**: The frontend attaches the Access Token as a Bearer token in the `Authorization` header.
3. **Token Expiry (Interceptor Flow)**:
   - If the Access Token expires, the backend returns a `401`.
   - The frontend Axios interceptor pauses all outgoing requests.
   - It silently calls `POST /api/auth/refresh`. The browser automatically includes the HttpOnly refresh token cookie.
   - The backend validates the refresh cookie and returns a new Access Token.
   - The interceptor applies the new token and resumes the paused requests.
4. **Role-Based Access Control (RBAC)**: Backend routes use an `authorizeRole(['admin', 'vendor'])` middleware. Vendors are strictly scoped to resources matching their `vendorId`.

---

## 7. Database Schema Overview

The core Mongoose schemas mapped to MongoDB collections:

- **Users**: Stores credentials, roles (`admin`, `vendor`, `customer`), and `fcmTokens` (array of devices for push notifications). If the user is a vendor, a `vendorId` field associates them with a specific stall.
- **Vendors**: Stores the stall profile (name, emoji, structured `location` (building, floor, stallNumber), UPI IDs, business status).
- **Products**: Owned by a specific `vendorId`. Tracks price, availability (`isAvailable`), and tags (e.g., `veg`, `spicy`).
- **Orders**: Contains embedded arrays of cart items. Tracks customer details, the target `vendorId`, the unique `token`, the `status` enum, and the S3/local URL of the uploaded UPI payment receipt.

---

## 8. Development & Build Pipeline

- **Local Development**: Running `npm run dev` at the root executes Vite for the frontend and `tsx watch` for the backend concurrently.
- **Production Build**: 
  - `npm run build:shared` compiles the TypeScript packages.
  - `npm run build:backend` uses `tsup` to bundle the Express server into an optimized format.
  - `npm run build:frontend` uses Vite to compile the React SPA into static assets in the `dist` directory.
