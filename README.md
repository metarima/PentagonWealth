# Pentagon Wealth (Node.js Starter)

Node.js starter website for Pentagon Wealth, built with:

- `Express` server
- A lightweight frontend SPA router (History API)
- Branded pages based on the sitemap:
  - Home
  - About Us
  - Services
  - Insights
  - Privacy Policy
  - Contact

## Run locally

1. Install dependencies:
   - `npm install`
2. Start in dev mode:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`

## Project structure

- `server.js` - Express server and SPA fallback route
- `public/index.html` - App shell (header/nav/footer)
- `public/styles.css` - Shared styling
- `public/app.js` - Client-side router, page transitions, and contact form logic

## Why this feels seamless

Navigation uses the browser History API, so clicking links swaps page content in the `<main id="app">` container without a full browser refresh.

## Contact API (phase 2)

- `POST /api/contact`
- Required body fields:
  - `fullName`
  - `email`
  - `serviceInterest`
  - `message`
- Honeypot anti-spam field:
  - `companyWebsite` (must remain empty)

## Hosting note

Because this is a Node.js app, GitHub Pages is not the right host for production runtime. Use a Node host such as:

- [Render](https://render.com/)
- [Railway](https://railway.app/)
- [Fly.io](https://fly.io/)
- [Vercel](https://vercel.com/) (with Node server setup)

If you still want GitHub Pages, we can convert this to a static-only SPA version and remove the Express dependency.