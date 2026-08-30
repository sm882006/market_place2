// Verification test for Direct Buy and Direct Rent endpoints
const BASE_URL = 'http://localhost:5001';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch((e) => {
    return { parseError: e.message };
  });
  return { status: res.status, ok: res.ok, data };
}

async function verifyDirectBuyAndRent() {
  console.log('🧪 Testing Direct Buy & Rent Endpoints...\n');

  const ts = Date.now();
  const sellerUsername = `seller_${ts}`;
  const buyerUsername = `buyer_${ts}`;
  const password = 'Password123!';

  // 1. Create Seller & Buyer
  const seller = (await req('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username: sellerUsername, email: `${sellerUsername}@pict.edu`, password })
  })).data;

  const buyer = (await req('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username: buyerUsername, email: `${buyerUsername}@pict.edu`, password })
  })).data;

  // 2. Seller lists a mouse for ₹400
  const prodRes = await req('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${seller.token}` },
    body: JSON.stringify({
      name: 'Wireless Mouse',
      price: 400,
      contact: '9511931794',
      category: 'Electronics & Gadgets',
      description: 'Smooth optical mouse'
    })
  });
  const product = prodRes.data.product;
  console.log(`✅ Product created: ${product.name} (ID: ${product.id})`);

  // 3. Buyer directly clicks "Confirm & Buy" (POST /api/products/:id/buy)
  console.log(`🛒 Buyer clicking Confirm & Buy (POST /api/products/${product.id}/buy)...`);
  const buyRes = await req(`/api/products/${product.id}/buy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyer.token}` },
    body: JSON.stringify({ contact: '1234567890' })
  });

  if (!buyRes.ok || buyRes.data.parseError) {
    throw new Error(`Direct buy failed: ${JSON.stringify(buyRes.data)}`);
  }
  console.log(`   ✅ Direct Buy response received (Status: ${buyRes.status}):`, buyRes.data.message);
  console.log(`   ✅ Order ID created: ${buyRes.data.order.id}`);

  // 4. Seller lists item for Rent
  const rentRes = await req('/api/rents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${seller.token}` },
    body: JSON.stringify({
      name: 'Scientific Calculator fx-991ES',
      rentPerDay: 50,
      deposit: 200,
      category: 'Electronics & Gadgets',
      contact: '9511931794'
    })
  });
  const rentItem = rentRes.data.rentItem;
  console.log(`✅ Rental created: ${rentItem.name} (ID: ${rentItem.id})`);

  // 5. Buyer directly clicks "Confirm & Rent" (POST /api/rents/:id/rent)
  console.log(`🏠 Buyer clicking Confirm & Rent (POST /api/rents/${rentItem.id}/rent)...`);
  const rentDirectRes = await req(`/api/rents/${rentItem.id}/rent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyer.token}` },
    body: JSON.stringify({ days: 3, contact: '1234567890' })
  });

  if (!rentDirectRes.ok || rentDirectRes.data.parseError) {
    throw new Error(`Direct rent failed: ${JSON.stringify(rentDirectRes.data)}`);
  }
  console.log(`   ✅ Direct Rent response received (Status: ${rentDirectRes.status}):`, rentDirectRes.data.message);
  console.log(`   ✅ Rental Order ID created: ${rentDirectRes.data.order.id}`);

  console.log('\n🎉 Direct Buy & Rent Endpoints Verified 100%! No JSON errors! 🚀');
}

verifyDirectBuyAndRent().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
