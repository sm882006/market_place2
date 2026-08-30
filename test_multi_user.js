// Multi-User Private Chat & Seller Approval Test
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
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTest() {
  console.log('🧪 Starting Multi-User Private Chat & Seller Permission Verification...\n');

  const ts = Date.now();
  const userA_name = `userA_${ts}`;
  const userB_name = `userB_${ts}`;
  const userC_name = `userC_${ts}`;
  const password = 'Password123!';

  // 1. Sign up User A (Seller)
  console.log('1️⃣ Creating User A (Seller)...');
  const resA = await req('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username: userA_name, email: `${userA_name}@pict.edu`, password })
  });
  if (!resA.ok) throw new Error(`User A signup failed: ${JSON.stringify(resA.data)}`);
  const tokenA = resA.data.token;
  const userA = resA.data.user;
  console.log(`   ✅ User A created: @${userA_name} (ID: ${userA.id})`);

  // 2. Sign up User B (Buyer)
  console.log('2️⃣ Creating User B (Buyer)...');
  const resB = await req('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username: userB_name, email: `${userB_name}@pict.edu`, password })
  });
  if (!resB.ok) throw new Error(`User B signup failed: ${JSON.stringify(resB.data)}`);
  const tokenB = resB.data.token;
  const userB = resB.data.user;
  console.log(`   ✅ User B created: @${userB_name} (ID: ${userB.id})`);

  // 3. Sign up User C (Unrelated Student)
  console.log('3️⃣ Creating User C (Unrelated 3rd Party Student)...');
  const resC = await req('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username: userC_name, email: `${userC_name}@pict.edu`, password })
  });
  if (!resC.ok) throw new Error(`User C signup failed: ${JSON.stringify(resC.data)}`);
  const tokenC = resC.data.token;
  const userC = resC.data.user;
  console.log(`   ✅ User C created: @${userC_name} (ID: ${userC.id})`);

  // 4. User A lists an engineering textbook
  console.log('4️⃣ User A lists an engineering item in marketplace...');
  const createProd = await req('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Engineering Mathematics Volume 3',
      price: 350,
      originalPrice: 700,
      category: 'Books',
      condition: 'Like New',
      contact: '9876543210',
      description: 'Used for semester 3. No torn pages.'
    })
  });
  if (!createProd.ok) throw new Error(`Product creation failed: ${JSON.stringify(createProd.data)}`);
  const product = createProd.data.product;
  console.log(`   ✅ Product listed: "${product.name}" (ID: ${product.id}) - Status: ${product.status}`);

  // 5. User B sends a buy request with a private message
  console.log('5️⃣ User B sends purchase request to User A...');
  const buyReq = await req(`/api/products/${product.id}/buy-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      message: 'Hi User A! Can we meet at the PICT Canteen today at 4 PM to test and exchange?'
    })
  });
  if (!buyReq.ok) throw new Error(`Buy request failed: ${JSON.stringify(buyReq.data)}`);
  const chatId = buyReq.data.chatId;
  console.log(`   ✅ Request sent! Private Chat created (ID: ${chatId})`);

  // 6. Verify User A received private notification
  console.log('6️⃣ User A checks private notifications in their Profile...');
  const notifsA = await req('/api/notifications', { headers: { Authorization: `Bearer ${tokenA}` } });
  const reqNotif = notifsA.data.find(n => n.type === 'buy_request' && n.productId === product.id);
  if (!reqNotif) throw new Error('User A did not receive buy_request notification!');
  console.log(`   ✅ User A notification verified: "${reqNotif.message}"`);

  // 7. Verify Privacy: User C (3rd party) CANNOT access the private chat!
  console.log('7️⃣ Testing Privacy: Verifying User C cannot access this 1-on-1 chat...');
  const chatByC = await req(`/api/chats/${chatId}`, { headers: { Authorization: `Bearer ${tokenC}` } });
  if (chatByC.status === 403) {
    console.log('   🔒 Privacy Confirmed: User C got 403 Forbidden on private chat thread.');
  } else {
    throw new Error(`Chat is not private! Status: ${chatByC.status}`);
  }

  // 8. User A & User B chat 1-on-1
  console.log('8️⃣ User A and User B exchange private 1-on-1 messages...');
  const replyA = await req(`/api/chats/${chatId}/message`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ text: 'Yes, 4 PM near Table 5 works for me!' })
  });
  if (!replyA.ok) throw new Error('User A message failed');
  console.log('   ✅ User A replied: "Yes, 4 PM near Table 5 works for me!"');

  // 9. User A gives permission: Approves Sale
  console.log('9️⃣ User A gives permission: Approving the sale...');
  const approveRes = await req(`/api/products/${product.id}/approve-sale`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  if (!approveRes.ok) throw new Error(`Approval failed: ${JSON.stringify(approveRes.data)}`);
  console.log('   ✅ User A approved! Product is now officially SOLD in the database.');

  // 10. Check Product is Sold
  const checkProds = await req('/api/products');
  const soldProd = checkProds.data.find(p => p.id === product.id);
  console.log(`   ✅ DB verified: Status is "${soldProd?.status}", Sold To: @${soldProd?.buyerUsername}`);
  if (soldProd?.status !== 'sold') throw new Error('Product was not marked sold!');

  // 11. Verify User B received private approval notification
  console.log('🔟 User B checks their private notifications...');
  const notifsB = await req('/api/notifications', { headers: { Authorization: `Bearer ${tokenB}` } });
  const approveNotif = notifsB.data.find(n => n.type === 'sale_approved' && n.productId === product.id);
  if (!approveNotif) throw new Error('User B did not receive approval notification!');
  console.log(`   ✅ User B received confirmation: "${approveNotif.message}"`);

  console.log('\n🎉 ALL MULTI-USER & PRIVACY TESTS PASSED 100%! 🚀');
}

runTest().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
