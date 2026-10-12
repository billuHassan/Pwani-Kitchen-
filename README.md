# Pwani Kitchen — Fictional Restaurant Ordering Demo

Live demo: https://pwani-kitchen-zanzibar-restaurant-concept-nf6twq.v2.appdeploy.ai/

Pwani Kitchen is a fictional Zanzibar-inspired restaurant portfolio concept. Menu items, prices, voucher codes, delivery fees, restaurant details, and order statuses are illustrative examples; this is not a real restaurant.

## Features
- Searchable menu with category filters and sample food imagery.
- Persistent shopping cart with quantity changes, line totals, removal, and checkout totals.
- Delivery or pickup checkout, with delivery-address validation for the demo.
- Vouchers: PWANI10 (10% off, minimum TZS 20,000), KARIBU15 (15% off, minimum TZS 30,000), and ISLAND5000 (TZS 5,000 off, minimum TZS 40,000).
- Secure AppDeploy sign-in/sign-out popup; app passwords are not collected.
- Server-side orders for signed-in customers, with reads and updates scoped to the authenticated user ID.
- Guest orders stored only in the current browser's local storage.
- Order references, account/guest order history, and simulated progress transitions.
- Simulated mobile-money/card outcomes and pay-on-pickup; no real charge or payment details.

## Demo safety and production limitations
- There is no real payment processing. A simulated success is only a demonstration outcome.
- Never enter real card numbers, CVVs, mobile-money PINs, OTPs, or banking credentials.
- Guest order history is browser-local and is not secure account storage.
- Server-side saved orders are associated with the authenticated user. The backend checks the menu IDs, quantity boundaries, voucher eligibility, service type, delivery address, and demo payment status.
- Prices, vouchers, availability, delivery fees, and order status transitions are illustrative. No courier, kitchen, inventory, customer notifications, or real business systems are connected.
- Obtain business-owner approval before any official launch. Replace all fictional business content only with approved details, publish privacy/terms/refund policies, test accessibility and security, configure monitoring, and implement real operations before accepting real customer orders.
- To accept real payments, integrate an appropriate provider using its secure server-side confirmation/webhook flow. Do not store raw card data.

## Run locally
Requires a current Node.js LTS and npm.

\`\`\`sh
npm install
npm run dev
\`\`\`

The AppDeploy auth popup and database routes require the AppDeploy runtime and will not function in plain local Vite without an equivalent backend.

## Build
\`\`\`sh
npm run build
npm run preview
\`\`\`

## Project structure
- \`src/App.tsx\`: customer storefront and ordering experience.
- \`src/index.css\`: responsive visual system.
- \`backend/index.ts\`: authenticated order creation, read, and progress endpoints.
- \`tests/tests.json\`: user-visible end-to-end test plan.

## Launch checklist
- [ ] Run the production build and desktop/mobile acceptance tests.
- [ ] Confirm cross-account order isolation, input validation, and failure handling.
- [ ] Replace fictional menu, imagery, pricing and contact information with approved content.
- [ ] Add an owner-approved privacy notice, terms and refund policy.
- [ ] Configure real inventory, delivery and operations integrations, if required.
- [ ] Integrate a real payment provider securely before claiming payments are supported.
- [ ] Ensure the restaurant owner controls the domain and hosting account.