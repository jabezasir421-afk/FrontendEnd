# BlueCollar Frontend — Swiss Modernism 2.0 Interface

A modern interpretation of the **Swiss International Style** with strict mathematical spacing, a rational 12-column grid system, and modular type hierarchy for the BlueCollar marketplace platform.

---

## 📐 Design Philosophy: Swiss Modernism 2.0

- **Grid System:** Strict 12-column mathematical grid (`display: grid; grid-template-columns: repeat(12, 1fr); gap: 2rem; max-width: 72rem;`).
- **Typography:** Helvetica Neue / Helvetica / Inter sans-serif font stack. Strict modular type scale (h1 3.75rem / 60px with -0.02em letter spacing, red uppercase eyebrows, muted lead text, tabular figures for rates and ratings).
- **Geometry & Hierarchy:** Zero border-radius (`border-radius: 0 !important`), zero drop shadows, hairline division rules (`1px solid var(--rule)`), asymmetric modularity.
- **Color Palette:**
  - Primary Background: `#FFFFFF`
  - Secondary Container: `#F5F5F5`
  - Dominant Foreground / Ink: `#000000`
  - Accent / Eyebrow / State: `#DC2626`
  - Hairline Rule: `#E5E7EB`
  - Muted Lead / Caption: `#4B5563`
- **Effects & Motion:** Pure flat color, instant color-change hovers (black to red `#DC2626`), high-contrast focus rings (`outline: 2px solid var(--red); outline-offset: 3px;`), and strict `prefers-reduced-motion` respect.
- **Accessibility:** 100% WCAG AA contrast compliance across all text and interactive controls. Full keyboard navigation and ARIA landmarks.

---

## 🚀 Features & Backend Alignment

The frontend interfaces directly with the Spring Boot backend (`/api/v1`):

1. **Trade Directory & Advanced Search (`/api/v1/search/workers`)**
   - Filter by Service Discipline (Electrical, Sanitary, Carpentry, HVAC, Masonry, Coating).
   - Filter by Canton / City (Zurich, Basel, Bern, Geneva, Lucerne).
   - Real-time sliders for Max Rate (CHF/h), Min Rating, Verified Trade Licenses, and Live Availability.
2. **Worker Dossier Modal (`/api/v1/workers/{id}`, `/reviews/worker/{id}`)**
   - Comprehensive trade credentials, ISO/DIN verification status, experience years.
   - Operating weekly schedule table (Monday through Sunday shifts).
   - Customer review breakdown and audit scores.
3. **Dispatch Specification & Booking Flow (`/api/v1/bookings`)**
   - Direct service ordering with date picker, shift window, site address selector, and technical instructions.
   - Deterministic transparent pricing (Hourly Rate × Estimated Hours = Fixed Dispatch CHF).
4. **Customer Portal (`/api/v1/bookings/customers/me`)**
   - Live dispatch order tracker with color-coded status badges (`PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - Cancellation and reschedule controls.
   - Post-completion Quality Audit submission (Rating & Review).
   - Registered job site address book management (`/api/v1/customers/me/addresses`).
5. **Tradesman Workbench (`/api/v1/bookings/workers/me`)**
   - Dispatch order lifecycle control (Accept, Reject, Start Work, Complete Delivery with final invoice).
   - Profile audit score meter (95% completion).
   - Real-time online heartbeat and bookable availability toggles.
6. **Platform Administration & Telemetry Console (`/api/v1/admin/*`)**
   - **01 // Overview & KPIs**: Executive telemetry cards (Lifetime Volume, Gross Revenue, Active Specialists, Quality Tolerance).
   - **02 // Analytics & Charts**:
     - *14-Day Dispatch Trajectory*: Strict Swiss SVG coordinate chart showing daily created vs completed dispatches with hairline guidelines.
     - *Rating Distribution Histogram*: 5-star to 1-star frequency bars with mathematical percentage indicators.
     - *Category Market Share Density*: Horizontal proportion bars mapping revenue volume by trade discipline.
     - *Performance Leaderboard*: Top commissioned specialists ranking with settled earnings CHF.
     - *Cache Refresh*: Trigger manual analytics snapshot recalculation (`POST /admin/analytics/refresh`).
   - **03 // Specialist Verification**: Complete accreditation queue with Verify/Unverify toggles.
   - **04 // Review Moderation**: Disputed client rating queue with violation explanations and deactivate/restore controls (`/admin/reviews`).
   - **05 // User Directory**: Platform user management with role filtering (Customer, Worker, Admin) and account suspension/restoration (`/admin/users`).
   - **06 // Immutable Audit Trail**: Chronological event ledger tracking all governance actions (`/admin/audit-logs`).
7. **In-App Notification Center (`/api/v1/notifications`)**
   - Live dispatch alerts drawer with unread count badge, mark-read, and mark-all-audited actions.
8. **Scheduling & Portfolio Enhancements**
   - Reschedule booking modal with datetime adjustment (`PUT /bookings/{id}/reschedule`).
   - Tradesman portfolio item registration (bumps profile integrity to 100%).
   - Weekly operating schedule matrix with shift toggles per workday.
   - 6 recognized trade disciplines quick taxonomy filter matrix.
9. **Identity Authentication (`/api/v1/auth`)**
   - Sign in, customer registration, and worker registration.
   - Role View Selector and 1-Click Evaluation Shortcuts for instant testing.
   - Automatic live backend health detection with seamless fallback demo runtime.

---

## 🛠 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 26)
- npm 9+

### Installation & Run

```bash
# Navigate to Frontend directory
cd Frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be served at `http://localhost:3000`.
Vite is preconfigured to automatically proxy `/api` calls to `http://localhost:8080`.
