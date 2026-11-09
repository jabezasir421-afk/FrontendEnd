# BlueCollar Frontend — Customer & Worker Experience

A production-quality SvelteKit application implementing dedicated, decoupled experiences for **Customers** and **Workers** connecting with skilled blue-collar trade specialists.

> **Note on Architecture:** In accordance with the system specification, this frontend implements **ONLY** the Customer and Worker experiences. The Admin console is a decoupled, independent application.

---

## 🛠️ Technology Stack

- **Framework:** SvelteKit 2.17 + Svelte 5 (modern runes: `$state`, `$derived`, `$props`, `$effect`)
- **Language:** TypeScript 5.7 (strict mode)
- **Styling:** Tailwind CSS v4
- **State & Server Cache:** TanStack Query (`@tanstack/svelte-query` v5)
- **Validation:** Zod schemas aligned directly with Spring Boot DTO constraints
- **HTTP Client:** Native Fetch API client with Bearer auth injection, token refresh queue on 401, and `X-Correlation-ID` header
- **Testing:** Vitest 3.0 (unit & integration testing)
- **Icons:** Lucide Svelte

---

## 🚀 Application Structure & Experiences

```
src/
├── app.html
├── app.d.ts
├── styles/
│   └── app.css               # Tailwind v4 configuration & domain status badges
├── lib/
│   ├── api/                  # Spring Boot 4.1 REST client & services
│   │   ├── client.ts         # Centralized fetch wrapper & 401 refresh queue
│   │   ├── auth.ts           # Login, registration, password recovery, verification
│   │   ├── categories.ts     # Trade categories
│   │   ├── skills.ts         # Skills directory
│   │   ├── workers.ts        # Worker profiles, public slots & portfolios
│   │   ├── search.ts         # Filtered worker search
│   │   ├── bookings.ts       # Booking lifecycle (create, accept, start, complete, cancel, reschedule)
│   │   ├── reviews.ts        # Customer ratings & reviews
│   │   ├── addresses.ts      # Customer saved address book
│   │   ├── availability.ts   # Working hours, vacation mode, overrides, heartbeat
│   │   ├── portfolio.ts      # Work gallery, trade certificates, KYC identity docs
│   │   ├── customers.ts      # Customer profile & photo management
│   │   ├── files.ts          # Multipart file upload (PROFILE_PHOTO, CERTIFICATE, KYC, etc.)
│   │   └── notifications.ts  # In-app notifications & channel preferences
│   ├── components/
│   │   ├── layout/           # Role-aware Navbar & Footer
│   │   ├── ui/               # Accessible design system primitives (Button, Input, Card, Modal, etc.)
│   │   └── notifications/    # Shared In-App Notification Center
│   ├── schemas/              # Zod validation schemas
│   ├── stores/               # Svelte 5 reactive stores (authStore, toastStore)
│   ├── types/                # Domain TypeScript contracts matching Spring Boot entities
│   └── utils/
│       └── guard.ts          # Deterministic role-based route guard
└── routes/
    ├── +layout.svelte        # Root layout, QueryClientProvider, ToastContainer, Route Guard
    ├── +page.svelte          # Marketplace Landing Page & Category Showcase
    ├── +error.svelte         # Error boundary page
    ├── login/                # Universal sign-in with role-aware redirection
    ├── register/
    │   ├── customer/         # Customer account registration
    │   └── worker/           # Worker self-registration with category & skill pickers
    ├── forgot-password/      # Password recovery initiation
    ├── reset-password/       # Password reset with token
    ├── verify-email/         # Email verification & resend triggers
    ├── workers/
    │   ├── +page.svelte      # Worker Discovery & Filtered Search
    │   └── [id]/+page.svelte # Public Worker Profile, Portfolio Gallery & Reviews
    ├── customer/
    │   ├── dashboard/        # Customer home & quick access
    │   ├── book/[workerId]/  # Guided Booking Wizard with real-time open slots
    │   ├── bookings/         # Booking history, status filter, cancel/reschedule & reviews
    │   ├── addresses/        # Customer address book
    │   ├── profile/          # Customer profile details & avatar upload
    │   └── notifications/    # Customer alert center
    └── worker/
        ├── dashboard/        # Operational dashboard with live online/bookable toggles
        ├── bookings/         # Job acceptance & completion pipeline (Accept, Reject, Start, Complete)
        ├── availability/     # Weekly working hours, vacation mode & schedule exceptions
        ├── portfolio/        # Work gallery, trade certificates & KYC document verification
        └── notifications/    # Worker alert center
```

---

## 🔒 Route Protection & Role Isolation

The client-side route guard (`src/lib/utils/guard.ts`) guarantees strict role isolation:
1. **Unauthenticated Guests:** Can browse public catalog (`/`, `/workers`, `/workers/[id]`) and auth pages. Accessing protected spaces redirects to `/login?redirect=...`.
2. **Customers:** Permitted in `/customer/*`. Attempting to access worker routes immediately redirects to `/customer/dashboard`.
3. **Workers:** Permitted in `/worker/*`. Attempting to access customer routes immediately redirects to `/worker/dashboard`.
4. **Already Authenticated:** Visiting `/login` or `/register/*` redirects directly to the user's appropriate workspace.

---

## ⚙️ Development & Verification Commands

```bash
# Install dependencies
npm install

# Run development server (proxies /api to http://127.0.0.1:8080)
npm run dev

# Run Svelte & TypeScript diagnostic checks
npm run check

# Run complete Vitest suite (42+ unit & integration tests)
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔗 Backend Integration Details

- **Backend Base URL:** `http://127.0.0.1:8080/api/v1` (configured via `PUBLIC_API_BASE_URL` in `.env`)
- **Authentication:** JWT Bearer tokens with automatic transparent refresh queue on HTTP 401 via `POST /api/v1/auth/refresh`.
- **Correlation ID:** Every outgoing request automatically includes a unique `X-Correlation-ID: fe-{timestamp}-{rand}` for distributed tracing with backend audit logs.
