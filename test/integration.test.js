// Integration test suite for MarketPICT / CampusCart backend
const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('--- STARTING MARKETPLACE INTEGRATION TESTS ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    console.log('\n[1] Health Check');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.ok && healthData.status === 'ok' && healthData.database === 'MongoDB', 'Health check returns MongoDB connected');

    // 2. Register new student
    console.log('\n[2] Student Authentication & Registration');
    const testUsername = `student_${Date.now()}`;
    const testEmail = `${testUsername}@pict.edu`;
    const regRes = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: 'Password123!',
        department: 'Computer Engineering',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token && regData.user.username === testUsername, `Registered new student: @${testUsername}`);
    const studentToken = regData.token;

    // 3. Login
    console.log('\n[3] Login');
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUsername,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && loginData.token, `Logged in successfully with JWT token`);

    // 4. Student OTP verification
    console.log('\n[4] Student Verification OTP');
    const otpReqRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const otpReqData = await otpReqRes.json();
    assert(otpReqRes.ok && otpReqData.success, 'OTP generation requested successfully');

    // 5. Create Seller User & Product
    console.log('\n[5] Product Creation & Marketplace Search');
    const sellerUsername = `seller_${Date.now()}`;
    const sellerRes = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: sellerUsername,
        email: `${sellerUsername}@pict.edu`,
        password: 'Password123!',
        department: 'Information Technology',
      }),
    });
    const sellerData = await sellerRes.json();
    const sellerToken = sellerData.token;

    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Calculus for Engineers 3rd Edition',
        price: 350,
        originalPrice: 700,
        category: 'Books & Study Material',
        condition: 'Like New',
        handleTime: 'Immediate',
        contact: '9876543210',
        location: 'PICT Library',
        description: 'Complete syllabus covered with solved university papers',
      }),
    });
    const prodData = await prodRes.json();
    assert(prodRes.status === 201 && prodData.id && prodData.price === 350, `Created product listing: "${prodData.name}"`);

    // Search product
    const searchRes = await fetch(`${BASE_URL}/api/products?search=Calculus`);
    const searchData = await searchRes.json();
    assert(searchData.length > 0 && searchData.some((p) => p.id === prodData.id), 'Search returned the newly created calculus book');

    // Product Detail Page Endpoint
    const detailRes = await fetch(`${BASE_URL}/api/products/${prodData.id}`);
    const detailData = await detailRes.json();
    assert(detailRes.ok && detailData.product.views >= 1 && detailData.seller.username === sellerUsername, 'Product detail returned views count and seller info');

    // 6. Buy Request & Order Flow
    console.log('\n[6] Buy Request & Order Flow');
    const buyReqRes = await fetch(`${BASE_URL}/api/products/${prodData.id}/buy-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        buyerContact: '9123456789',
        meetingLocation: 'PICT Quad',
      }),
    });
    const buyReqData = await buyReqRes.json();
    assert(buyReqRes.ok && buyReqData.order && buyReqData.order.status === 'pending', 'Buy request created pending Order record');

    // Seller approves sale
    const approveRes = await fetch(`${BASE_URL}/api/products/${prodData.id}/approve-sale`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const approveData = await approveRes.json();
    assert(approveRes.ok && approveData.product.status === 'sold', 'Seller approved sale; product marked as "sold"');

    // 7. Order Status Tracking
    console.log('\n[7] Order Tracking & Review Flow');
    const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const ordersData = await ordersRes.json();
    const myOrder = ordersData.find((o) => o.itemId === prodData.id);
    assert(myOrder && myOrder.status === 'completed', 'Order tracking reflects completed status and timeline');

    // Student reviews seller
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        orderId: myOrder.id,
        rating: 5,
        comment: 'Super fast handover at PICT library! Book was in mint condition.',
      }),
    });
    const reviewData = await reviewRes.json();
    assert(reviewRes.status === 201 && reviewData.sellerStats.ratingsAverage === 5, 'Review submitted successfully; seller reputation updated');

    // 8. Rental Overlap Prevention
    console.log('\n[8] Rental Booking & Overlap Prevention');
    const rentCreateRes = await fetch(`${BASE_URL}/api/rents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Logitech Presenter Remote',
        category: 'Electronics & Gadgets',
        rentPerDay: 50,
        deposit: 200,
        condition: 'Like New',
        contact: '9876543210',
        location: 'PICT Hostel 2',
      }),
    });
    const rentItem = await rentCreateRes.json();
    assert(rentCreateRes.status === 201 && rentItem.id, 'Created rental listing');

    // First student books rental for 3 days starting 2026-10-01 to 2026-10-04
    const rentReq1 = await fetch(`${BASE_URL}/api/rents/${rentItem.id}/rent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        days: 3,
        startDate: '2026-10-01',
        endDate: '2026-10-04',
      }),
    });
    assert(rentReq1.ok, 'First rental booking submitted for Oct 1 to Oct 4');

    // Owner approves first rental
    const rentApprove = await fetch(`${BASE_URL}/api/rents/${rentItem.id}/approve-rent`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(rentApprove.ok, 'Owner approved first rental booking');

    // Second student attempts to book overlapping dates (Oct 2 to Oct 5)
    const secondStudentRes = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `student2_${Date.now()}`,
        email: `student2_${Date.now()}@pict.edu`,
        password: 'Password123!',
      }),
    });
    const secondStudentData = await secondStudentRes.json();

    const overlapRentReq = await fetch(`${BASE_URL}/api/rents/${rentItem.id}/rent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondStudentData.token}`,
      },
      body: JSON.stringify({
        days: 3,
        startDate: '2026-10-02',
        endDate: '2026-10-05',
      }),
    });
    assert(overlapRentReq.status === 409, 'Overlapping rental request successfully REJECTED with 409 Conflict');

    // 9. Smart Lost & Found Matching
    console.log('\n[9] Lost & Found Smart Matching Engine');
    const lostRes = await fetch(`${BASE_URL}/api/lostfound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Blue Boat Wireless Earbuds Case',
        type: 'lost',
        category: 'Electronics & Gadgets',
        location: 'PICT Canteen',
        contact: '9876543210',
        description: 'Lost navy blue Boat Airdopes charging case near table 5',
      }),
    });
    const lostItem = await lostRes.json();

    // Opposite user posts found item
    const foundRes = await fetch(`${BASE_URL}/api/lostfound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: 'Boat Earbuds Case Found',
        type: 'found',
        category: 'Electronics & Gadgets',
        location: 'PICT Canteen',
        contact: '9988776655',
        description: 'Found blue Boat audio case on canteen table',
      }),
    });
    const foundItem = await foundRes.json();

    // Test Smart Matching endpoint
    const matchRes = await fetch(`${BASE_URL}/api/lostfound/matches/${lostItem.id}`);
    const matchData = await matchRes.json();
    assert(
      matchRes.ok &&
        matchData.matches.length > 0 &&
        matchData.matches.some((m) => m.item.id === foundItem.id),
      'Smart Match Engine correctly identified matching lost & found items with category, location & keyword overlap'
    );

    // 10. Admin moderation
    console.log('\n[10] Admin Controls & Moderation');
    const adminUserRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'utk',
        password: 'Password123!', // or test if admin role
      }),
    });
    // Check admin stats if permitted
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(statsRes.status === 403, 'Non-admin users are strictly blocked (403 Forbidden) from admin dashboard');

    console.log(`\n==============================================`);
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==============================================`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
