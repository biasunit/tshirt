
// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context){
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try{
    const { items } = JSON.parse(event.body || '{}');
    if(!Array.isArray(items) || !items.length){
      return { statusCode: 400, body: 'No items' };
    }

    // Example: single product with one price ID; you can map colorway->price if needed.
    // Set this in your Netlify env vars.
    const PRICE_ID = process.env.STRIPE_PRICE_ID; // e.g. price_123

    // Sum quantity
    const qty = items.reduce((s,i)=> s + (i.qty||1), 0);

    const metadata = {
      sizes: items.map(i=>`${i.size}:${i.qty}`).join(','),
      colorways: items.map(i=>`${i.colorway}:${i.qty}`).join(','),
      sku: items[0]?.sku || 'SKU'
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        { price: PRICE_ID, quantity: Math.max(1, qty) }
      ],
      currency: 'eur',
      success_url: process.env.SUCCESS_URL || 'https://example.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://example.com/cancel',
      metadata
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ id: session.id })
    };
  }catch(err){
    return { statusCode: 500, body: err.message };
  }
};
