
# HOLOLULU — Daisy Riot Tee (Stripe Checkout + Colorways + Size Chart)

This is a static product page with:
- Stripe Checkout (serverless) **or** Stripe Payment Links
- Multiple colorways (White/Cobalt, Cobalt/White)
- Size chart modal

## 1) Quick setup with Payment Links (no server)
- Open `assets/js/app.js`
- Set `CHECKOUT_MODE` to `"payment_link"`
- Replace the `PAYMENT_LINKS` URLs with your Stripe Payment Links
- Deploy (Netlify, Vercel, GitHub Pages). Done.

## 2) Real Stripe Checkout (recommended)
Create a price in Stripe and grab its `price_XXXX` ID.

### Netlify
- Put `netlify/functions/create-checkout-session.js` in your repo (already here)
- In Netlify dashboard, set environment variables:
  - `STRIPE_SECRET_KEY` = `sk_live_...` (or test key)
  - `STRIPE_PRICE_ID`   = `price_...`
  - `SUCCESS_URL`       = `https://your-domain/success`
  - `CANCEL_URL`        = `https://your-domain/cancel`
- In `assets/js/app.js` set:
  - `CHECKOUT_MODE = "server"`
  - `STRIPE_PUBLISHABLE_KEY = "pk_live_..."` (or test key)
- Deploy to Netlify. Your function will be available at `/api/create-checkout-session`
  (Netlify automatically proxies from `/api/*` to `/.netlify/functions/*` if you add a redirect rule;
   alternatively, change the fetch URL in `app.js` to `/.netlify/functions/create-checkout-session`).

### Vercel
- Use `api/create-checkout-session.js` (already here)
- In Vercel project settings, add environment variables:
  - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `SUCCESS_URL`, `CANCEL_URL`
- In `assets/js/app.js`: set publishable key and `CHECKOUT_MODE = "server"`
- Deploy. The API route will be at `/api/create-checkout-session`.

## Notes
- Server mode passes size and colorway as `metadata` on the Checkout Session for order reconciliation.
- For multiple prices (e.g., per colorway), map `colorway -> price_id` in the serverless code.
- Images are compressed WEBP for fast loads.
