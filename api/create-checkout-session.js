// /api/create-checkout-session.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID, SUCCESS_URL, CANCEL_URL } = process.env;
  const missing = [];
  if (!STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!STRIPE_PRICE_ID)   missing.push('STRIPE_PRICE_ID');
  if (!SUCCESS_URL)       missing.push('SUCCESS_URL');
  if (!CANCEL_URL)        missing.push('CANCEL_URL');
  if (missing.length) return res.status(500).send('Missing env vars: ' + missing.join(', '));

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).send('No items');

    const qty = items.reduce((s, i) => s + Math.max(1, i.qty || 1), 0);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: Math.max(1, qty) }],
      currency: 'eur',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        sizes: items.map(i => `${i.size}:${i.qty}`).join(','),
        colorways: items.map(i => `${i.colorway}:${i.qty}`).join(','),
        sku: items[0]?.sku || 'SKU'
      }
    });

    return res.status(200).json({ id: session.id });
  } catch (e) {
    console.error('Stripe error:', e?.raw?.message || e.message);
    return res.status(500).send(e?.raw?.message || e.message || 'Server error');
  }
}
