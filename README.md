# Pwani Kitchen — Zanzibar Restaurant Concept

Live demo: https://pwani-kitchen-zanzibar-restaurant-concept-nf6twq.v2.appdeploy.ai/

A responsive, fictional restaurant website concept inspired by Zanzibar's coastal food culture. **Pwani Kitchen is not a real business.** All menu items, prices, business details, and story copy are illustrative placeholders.

## Features
- Responsive navigation and layout
- Sample menu with Tanzanian shilling (TZS) prices and working category filters
- Featured dishes and responsive food gallery
- Fictional story and location sections
- Contact and social details deliberately left as placeholders
- Accessibility considerations, reduced-motion support, visible keyboard focus, and graceful image fallbacks
- Clear unofficial-demo disclaimers

## Technologies
- React + Vite + TypeScript
- Tailwind CSS
- Lucide React

## Prerequisites
- Node.js (current LTS recommended)
- npm

## Install and run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite.

## Production build
```bash
npm run build
npm run preview
```

## Where to edit content
- **Menu items and sample prices:** edit the `menu` array near the top of `src/App.tsx`.
- **Menu categories:** edit the `categories` array in `src/App.tsx`.
- **Currency formatting:** edit the `money` helper in `src/App.tsx`.
- **Contact/location details:** edit the Location and Contact sections in `src/App.tsx`. They intentionally remain placeholders and there is no active phone, email, WhatsApp, map, or social link.
- **Images:** replace remote URLs in the `menu` and `gallery` arrays and in the Hero and Story sections. Use original, owner-supplied, or appropriately licensed images. An image fallback is displayed if a remote image fails.
- **Brand styling:** edit the design tokens near the top of `src/index.css`.
- **Page title and SEO description:** edit `index.html`.
- **Favicon:** replace `public/favicon.svg` with an approved brand mark if needed.

## WhatsApp configuration
No number is configured and no WhatsApp action is active in this demo. Before adding a WhatsApp link, obtain written permission and verify the business number. Add an explicit, validated international-format number and a click-to-chat URL. Never route customer messages to a personal or unapproved number.

## Deploy the demo
Run `npm run build` and deploy the generated `dist` directory to a static host such as Vercel or Netlify. Check the current free-tier terms before using a host for a client's production site.

## Owner approval checklist before official launch
- [ ] Obtain written owner approval for the website, branding, and public launch.
- [ ] Confirm the official business name and approved logo/brand assets.
- [ ] Replace all fictional dishes, descriptions, and sample prices with an owner-approved menu.
- [ ] Replace sample photography only with owner-supplied or properly licensed images.
- [ ] Verify telephone, WhatsApp, email, social links, address, map location, and opening hours.
- [ ] Agree who owns the domain and hosting account; client should retain account ownership.
- [ ] Agree project scope, payment, revision limits, support, maintenance, and handover terms.
- [ ] Review accessibility and test on current mobile and desktop browsers.
- [ ] Verify SEO metadata and any necessary privacy/legal notices.
- [ ] Remove unofficial-demo notices only after written approval and verified content are in place.
- [ ] Test navigation, external links, responsive layouts, and image fallbacks on the final build.

## Limitations
This is a frontend-only demo. It does not collect enquiries, process reservations, accept orders or payments, store customer data, or contain an admin panel. Menu filters are client-side only. Remote images and Google Fonts require an internet connection.
