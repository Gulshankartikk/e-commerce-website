import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Starting Comprehensive API & Multi-User Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('API Root Health Check (/api/health)', async () => {
    const res = await fetch('http://127.0.0.1:5000/api/health');
    const data = await res.json().catch(() => ({}));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
  });

  await test('API v1 Health Check (/api/v1/health)', async () => {
    const res = await req('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // 2. Multi-User Authentication Tests
  let adminToken, customerToken, sellerToken, managerToken;
  let adminUser, customerUser, sellerUser, managerUser;

  await test('Multi-User: FlashShop Admin Login (admin@flashshop.com)', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@flashshop.com', password: 'Admin@12345' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'admin');
    assert.ok(res.data.token);
    adminToken = res.data.token;
    adminUser = res.data.user;
  });

  await test('Multi-User: FlashShop Customer Login (demo@flashshop.com)', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'demo@flashshop.com', password: 'Demo@12345' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'user');
    assert.ok(res.data.token);
    customerToken = res.data.token;
    customerUser = res.data.user;
  });

  await test('Multi-User: Seller Login (seller@luxora.shop)', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'seller@luxora.shop', password: 'Seller@12345' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'seller');
    assert.ok(res.data.token);
    sellerToken = res.data.token;
    sellerUser = res.data.user;
  });

  await test('Multi-User: Manager Login (manager@luxora.shop)', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'manager@luxora.shop', password: 'Manager@12345' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'manager');
    assert.ok(res.data.token);
    managerToken = res.data.token;
    managerUser = res.data.user;
  });

  await test('Multi-User: Self-Registration with Seller Role', async () => {
    const testEmail = `test.seller.${Date.now()}@flashshop.com`;
    const res = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'New Registered Seller',
        email: testEmail,
        password: 'Password@123',
        role: 'seller',
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.user.role, 'seller');
  });

  // 3. Role-Based Access Control Guards
  await test('Security: Customer cannot access Admin Dashboard (Expect 403)', async () => {
    const res = await req('/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('Security: Manager CAN access Admin Dashboard (Expect 200)', async () => {
    const res = await req('/admin/dashboard', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.stats);
  });

  await test('Security: Admin CAN access Admin Dashboard (Expect 200)', async () => {
    const res = await req('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.stats);
  });

  // 4. Products & Catalog
  let sampleProduct;
  await test('Storefront: GET /products (Listing, Filters & Pagination)', async () => {
    const res = await req('/products?limit=5');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.products.length > 0);
    sampleProduct = res.data.products[0];
  });

  await test('Storefront: GET /products/home', async () => {
    const res = await req('/products/home');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.featured);
    assert.ok(res.data.bestSellers);
  });

  await test('Storefront: GET /products/suggestions?keyword=nova', async () => {
    const res = await req('/products/suggestions?keyword=nova');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.suggestions));
  });

  await test('Storefront: GET /categories and /brands', async () => {
    const resCat = await req('/categories');
    assert.strictEqual(resCat.status, 200);
    assert.ok(resCat.data.categories.length > 0);

    const resBrand = await req('/brands');
    assert.strictEqual(resBrand.status, 200);
    assert.ok(resBrand.data.brands.length > 0);
  });

  // 5. Cart & Coupon Operations (Customer Flow)
  await test('Commerce: Customer Add to Cart', async () => {
    // Clear cart first
    await req('/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    const res = await req('/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { productId: sampleProduct._id, quantity: 2 },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.cart.items.length, 1);
    assert.strictEqual(res.data.cart.items[0].quantity, 2);
  });

  await test('Commerce: Customer Apply Coupon (WELCOME10)', async () => {
    const res = await req('/cart/coupon', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { code: 'WELCOME10' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.cart.coupon.code, 'WELCOME10');
    assert.ok(res.data.totals.discount > 0);
  });

  // 6. Address & Order Placement Flow
  let addressId;
  await test('Account: Add Delivery Address', async () => {
    const res = await req('/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        fullName: 'Demo Customer',
        phone: '9876543210',
        line1: '123 Luxury Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        isDefault: true,
      },
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.addresses.length > 0);
    addressId = res.data.addresses[0]._id;
  });

  let createdOrder;
  await test('Commerce: Place Cash-on-Delivery Order', async () => {
    const res = await req('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        addressId,
        deliveryOption: 'standard',
      },
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.order);
    assert.strictEqual(res.data.order.paymentMethod, 'cod');
    createdOrder = res.data.order;
  });

  await test('Commerce: GET /orders/:id (Customer and Manager Access)', async () => {
    // Customer access
    const resCustomer = await req(`/orders/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(resCustomer.status, 200);

    // Manager access
    const resManager = await req(`/orders/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(resManager.status, 200);
  });

  // 7. Admin / Manager Operations
  await test('Admin: Update Order Status to Processing', async () => {
    const res = await req(`/orders/${createdOrder._id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { status: 'processing', note: 'Item picked and packed' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.order.status, 'processing');
  });

  await test('Admin: Manage User Role (Promote customer to manager and back)', async () => {
    // Promote
    const resPromote = await req(`/admin/users/${customerUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'manager' },
    });
    assert.strictEqual(resPromote.status, 200);
    assert.strictEqual(resPromote.data.user.role, 'manager');

    // Revert back to user
    const resRevert = await req(`/admin/users/${customerUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'user' },
    });
    assert.strictEqual(resRevert.status, 200);
    assert.strictEqual(resRevert.data.user.role, 'user');
  });

  // 8. Wishlist & Notifications
  await test('Customer: Toggle Wishlist Product', async () => {
    const res = await req(`/wishlist/${sampleProduct._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.wishlist);
  });

  await test('Customer: Check Notifications', async () => {
    const res = await req('/notifications', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.notifications));
  });

  // 9. AI Shopping Concierge & Gemini Endpoints
  let aiSessionId;
  await test('AI Concierge: Natural Language Shopping Query', async () => {
    const res = await req('/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { message: 'I need wireless earbuds with active noise cancellation for flying' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.reply && res.data.reply.length > 10);
    assert.ok(Array.isArray(res.data.products));
    assert.ok(res.data.products.length > 0);
    assert.ok(res.data.sessionId);
    aiSessionId = res.data.sessionId;
  });

  await test('AI Concierge: Budget Filter Enforcement (under 5000)', async () => {
    const res = await req('/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        message: 'Show me audio and sports gear under 5000',
        sessionId: aiSessionId,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.budgetDetected, 5000);
    // Every recommended product must strictly be <= 5000
    res.data.products.forEach((p) => {
      assert.ok(p.price <= 5000, `Product ${p.name} priced at ₹${p.price} exceeds ₹5000 budget`);
    });
  });

  await test('AI Concierge: Polite Handling of Unsupported Products', async () => {
    const res = await req('/ai/chat', {
      method: 'POST',
      body: { message: 'Do you sell fresh groceries or airline tickets?' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.intent, 'unsupported');
    assert.ok(res.data.reply.toLowerCase().includes('curated') || res.data.reply.toLowerCase().includes('specialize'));
  });

  await test('AI Concierge: Product Review Summary with Real Evidence', async () => {
    const res = await req(`/ai/review-summary/${sampleProduct._id}`, {
      method: 'GET',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.summary);
    assert.ok(Array.isArray(res.data.summary.pros));
    assert.ok(Array.isArray(res.data.summary.cons));
  });

  await test('AI Concierge: Side-by-Side Comparison Matrix', async () => {
    const productsRes = await req('/products?limit=2');
    assert.ok(productsRes.data.products.length >= 2);
    const id1 = productsRes.data.products[0]._id;
    const id2 = productsRes.data.products[1]._id;

    const res = await req('/ai/compare', {
      method: 'POST',
      body: { productIds: [id1, id2] },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.comparison);
    assert.ok(res.data.comparison.summary);
    assert.ok(res.data.comparison.verdict);
    assert.strictEqual(res.data.products.length, 2);
  });

  await test('AI Concierge: Persistent Chat History for Logged-In User', async () => {
    const res = await req('/ai/history', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.sessions));
    assert.ok(res.data.sessions.length > 0);
  });

  console.log('\n----------------------------------------');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test suite runner crashed:', e);
  process.exit(1);
});
