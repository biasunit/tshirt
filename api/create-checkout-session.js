
// /api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try{
    const { items } = req.body || {};
    if(!Array.isArray(items) || !items.length){
      return res.status(400).send('No items');
    }

    const PRICE_ID = process.env.STRIPE_PRICE_ID; // e.g. price_123
    const qty = items.reduce((s,i)=> s + (i.qty||1), 0);

    const metadata = {
      sizes: items.map(i=>`${i.size}:${i.qty}`).join(','),
      colorways: items.map(i=>`${i.colorway}:${i.qty}`).join(','),
      sku: items[0]?.sku || 'SKU'
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_ID, quantity: Math.max(1, qty) }],
      currency: 'eur',
      success_url: process.env.SUCCESS_URL || 'https://example.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://example.com/cancel',
      metadata
    });

    res.status(200).json({ id: session.id });
  }catch(e){
    res.status(500).send(e.message);
  }
}
