
/** Config **/
// MODE: "server" (recommended) uses your serverless function to create a Stripe Checkout Session.
// MODE: "payment_link" uses a prebuilt Stripe Payment Link per colorway (quick setup, limited metadata).
const CHECKOUT_MODE = "server"; // "server" or "payment_link"

// Set your Stripe publishable key here (server mode). Example: "pk_live_..."
const STRIPE_PUBLISHABLE_KEY = "pk_test_51Rul9NPRSp4gs3hymRfSmRGk2Vhs8Pr328J5GB1ZTRGlW0WnkavQDlvLqZFvILMF44U9sY8ejkdcLEkGqwCfkqTI00JGwxYyKU";

// Payment Link mode: map colorway -> Payment Link URL (replace with your real links).
const PAYMENT_LINKS = {
  "white-cobalt": "https://buy.stripe.com/REPLACE_WHITE_COBALT",
  "cobalt-white": "https://buy.stripe.com/REPLACE_COBALT_WHITE"
};

// Product config
const PRODUCT = {
  sku: "TSHIRT-HOLOLULU",
  name: "HOLOLULU Daisy Riot Tee",
  price_eur: 35,
  currency: "eur",
  colorways: [
    { id:"white-cobalt",  label:"White Tee / Cobalt Ink", tee:"#fff", ink:"#1140ff" },
    { id:"cobalt-white",  label:"Cobalt Tee / White Ink", tee:"#1140ff", ink:"#ffffff" }
  ],
  sizes: ["S","M","L","XL","XXL"]
};

/** UI wiring **/
const qtyInput = document.querySelector('#qty');
const priceEl  = document.querySelector('#price');
const addBtn   = document.querySelector('#addToCart');
const sizeRadios = document.querySelectorAll('input[name="size"]');
const colorRadios = document.querySelectorAll('input[name="colorway"]');
const cartCount = document.querySelector('#cartCount');
const checkoutBtn = document.querySelector('#checkout');
const sizeChartLink = document.querySelector('#sizeChartLink');

function getQty(){ return Math.max(1, parseInt(qtyInput.value || "1", 10)); }
function getSize(){
  let s = "M"; sizeRadios.forEach(r => { if(r.checked) s = r.value; }); return s;
}
function getColorway(){
  let c = "white-cobalt"; /*__COLORWAY_SWAP__*/
colorRadios.forEach(r => { if(r.checked) c = r.value; }); return c;
}
function updatePrice(){
  const total = PRODUCT.price_eur * getQty();
  priceEl.textContent = `€${total.toFixed(2)}`;
}
qtyInput.addEventListener('change', updatePrice);
document.querySelectorAll('.qty button').forEach(btn => {
  btn.addEventListener('click', () => {
    const delta = btn.dataset.delta === "inc" ? 1 : -1;
    qtyInput.value = Math.max(1, getQty() + delta);
    updatePrice();
  });
});
updatePrice();

function readCart(){ try { return JSON.parse(localStorage.getItem('cart')||'[]'); } catch { return []; } }
function writeCart(items){ localStorage.setItem('cart', JSON.stringify(items)); }
function refreshCount(){
  const items = readCart();
  const count = items.reduce((s,i)=>s+i.qty,0);
  cartCount.textContent = count;
}
refreshCount();

addBtn.addEventListener('click', () => {
  const items = readCart();
  items.push({
    sku: PRODUCT.sku,
    name: PRODUCT.name,
    size: getSize(),
    colorway: getColorway(),
    qty: getQty(),
    price: PRODUCT.price_eur,
    currency: PRODUCT.currency
  });
  writeCart(items);
  refreshCount();
  addBtn.textContent = "Added ✓";
  setTimeout(()=> addBtn.textContent = "Add to cart", 1600);
});

/** Size chart modal **/
const backdrop = document.querySelector('#modalBackdrop');
const modal    = document.querySelector('#sizeModal');
const closeBtns = document.querySelectorAll('[data-close-modal]');

function openModal(){
  backdrop.style.display = "block";
  modal.style.display = "block";
}
function closeModal(){
  backdrop.style.display = "none";
  modal.style.display = "none";
}
sizeChartLink.addEventListener('click', openModal);
backdrop.addEventListener('click', closeModal);
closeBtns.forEach(b => b.addEventListener('click', closeModal));

/** Checkout **/
async function doStripeServerCheckout(items){
  // Load Stripe.js if available
  if (typeof Stripe === "undefined" || STRIPE_PUBLISHABLE_KEY.includes("REPLACE_ME")){
    alert("Stripe is not configured yet. Add your publishable key and deploy with the provided serverless function.");
    return;
  }
  const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

  // Call your serverless function to create a Checkout Session
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ items })
  });
  if(!res.ok){
    const text = await res.text();
    alert("Checkout error: " + text);
    return;
  }
  const data = await res.json();
  const { id } = data;
  const { error } = await stripe.redirectToCheckout({ sessionId: id });
  if(error){ alert(error.message); }
}

function doPaymentLinkCheckout(items){
  // One product, pick first item's colorway to choose the link.
  const colorway = items[0]?.colorway || "white-cobalt";
  const link = PAYMENT_LINKS[colorway];
  if(!link || link.includes("REPLACE_")){
    alert("Payment Link not configured. Replace PAYMENT_LINKS URLs in app.js.");
    return;
  }
  // Simply redirect (size won't be captured as metadata in this mode).
  window.location.href = link;
}

checkoutBtn.addEventListener('click', ()=>{
  const items = readCart();
  if(!items.length){ alert("Your cart is empty."); return; }
  if(CHECKOUT_MODE === "server"){ doStripeServerCheckout(items); }
  else { doPaymentLinkCheckout(items); }
});



/** Swap main image based on colorway **/
function applyColorwayImage(){
  const img = document.querySelector('#heroImg');
  const c = getColorway();
  const badge = document.querySelector('.badge');
  if(c === "white-cobalt"){
    img.src = "assets/img/mockup_model.webp";
    badge.textContent = "BACK PRINT — WHITE/COBALT";
  }else{
    img.src = "assets/img/mockup_model_cobalt.webp";
    badge.textContent = "BACK PRINT — COBALT/WHITE";
  }
}
colorRadios.forEach(r => { r.addEventListener('change', applyColorwayImage); });
// initial
applyColorwayImage();
