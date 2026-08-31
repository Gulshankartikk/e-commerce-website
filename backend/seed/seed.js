/**
 * Minimal seed: demo admin + user, 4 categories, 4 brands, 8 products,
 * 1 hero banner, 1 welcome coupon.
 * Run: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Brand from '../src/models/Brand.js';
import Product from '../src/models/Product.js';
import Banner from '../src/models/Banner.js';
import Coupon from '../src/models/Coupon.js';

const img = (seed, w = 800, h = 800) => ({ url: `https://picsum.photos/seed/${seed}/${w}/${h}`, publicId: '' });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding…');

  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@luxora.shop', 'demo@luxora.shop', 'seller@luxora.shop', 'manager@luxora.shop'] } }),
    Category.deleteMany({}), Brand.deleteMany({}), Product.deleteMany({}), Banner.deleteMany({}), Coupon.deleteMany({}),
  ]);

  // Users (password hashing happens in the pre-save hook)
  const [admin, demo, seller, manager] = await User.create([
    { name: 'Admin User', email: 'admin@luxora.shop', password: 'Admin@12345', role: 'admin', isVerified: true },
    { name: 'Demo Customer', email: 'demo@luxora.shop', password: 'Demo@12345', role: 'user', isVerified: true },
    { name: 'Official Seller', email: 'seller@luxora.shop', password: 'Seller@12345', role: 'seller', isVerified: true },
    { name: 'Store Manager', email: 'manager@luxora.shop', password: 'Manager@12345', role: 'manager', isVerified: true },
  ]);

  const cats = await Category.create([
    { name: 'Electronics', slug: 'electronics', description: 'Audio, wearables and smart devices', image: img('cat-electronics', 600, 400) },
    { name: 'Fashion', slug: 'fashion', description: 'Apparel and footwear', image: img('cat-fashion', 600, 400) },
    { name: 'Home & Living', slug: 'home-living', description: 'Furniture and decor', image: img('cat-home', 600, 400) },
    { name: 'Sports', slug: 'sports', description: 'Fitness and outdoor gear', image: img('cat-sports', 600, 400) },
  ]);
  const brands = await Brand.create([
    { name: 'Nova', slug: 'nova', logo: img('brand-nova', 200, 200) },
    { name: 'Stride', slug: 'stride', logo: img('brand-stride', 200, 200) },
    { name: 'Haven', slug: 'haven', logo: img('brand-haven', 200, 200) },
    { name: 'Pulse', slug: 'pulse', logo: img('brand-pulse', 200, 200) },
  ]);
  const cat = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  const brand = Object.fromEntries(brands.map((b) => [b.slug, b._id]));

  const flashEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await Product.create([
    {
      name: 'Nova AirBeat Pro Wireless Earbuds', slug: 'nova-airbeat-pro-wireless-earbuds',
      description: 'Flagship true-wireless earbuds with 42dB hybrid active noise cancellation, spatial audio, and a 36-hour total battery life. IPX5 rated with wireless charging case.',
      highlights: ['42dB Hybrid ANC', '36h battery with case', 'Bluetooth 5.4', 'IPX5 water resistance'],
      price: 4999, mrp: 7999, images: [img('p-earbuds'), img('p-earbuds-2')], category: cat['electronics'], brand: brand['nova'],
      colors: ['Black', 'White'], variants: [{ color: 'Black', stock: 25 }, { color: 'White', stock: 15 }],
      stock: 40, sold: 320, isFeatured: true, isFlashSale: true, flashSaleEndsAt: flashEnd, tags: ['earbuds', 'audio', 'anc'],
    },
    {
      name: 'Pulse Vitals X2 Smartwatch', slug: 'pulse-vitals-x2-smartwatch',
      description: 'AMOLED always-on display, dual-band GPS, SpO2 and heart-rate tracking with 14-day battery life. Works with Android and iOS.',
      highlights: ['1.43" AMOLED', '14-day battery', 'Dual-band GPS', '120+ sport modes'],
      price: 6499, mrp: 8999, images: [img('p-watch'), img('p-watch-2')], category: cat['electronics'], brand: brand['pulse'],
      colors: ['Midnight', 'Silver'], variants: [{ color: 'Midnight', stock: 18 }, { color: 'Silver', stock: 12 }],
      stock: 30, sold: 210, isFeatured: true, tags: ['smartwatch', 'fitness'],
    },
    {
      name: 'Stride Velocity Running Shoes', slug: 'stride-velocity-running-shoes',
      description: 'Lightweight racer with responsive nitrogen-infused foam, breathable engineered mesh, and a carbon-composite plate for daily speed work.',
      highlights: ['Nitro foam midsole', '218g (UK 9)', 'Carbon plate', 'Reflective details'],
      price: 3999, mrp: 5499, images: [img('p-shoes'), img('p-shoes-2')], category: cat['fashion'], brand: brand['stride'],
      colors: ['Volt', 'Black'], sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
      variants: [
        { color: 'Volt', size: 'UK 8', stock: 10 }, { color: 'Volt', size: 'UK 9', stock: 8 },
        { color: 'Black', size: 'UK 9', stock: 12 }, { color: 'Black', size: 'UK 10', stock: 6 },
      ],
      stock: 36, sold: 415, isFeatured: true, isFlashSale: true, flashSaleEndsAt: flashEnd, tags: ['shoes', 'running'],
    },
    {
      name: 'Haven CloudRest Memory Foam Pillow', slug: 'haven-cloudrest-memory-foam-pillow',
      description: 'Gel-infused memory foam pillow with an ergonomic contour that keeps your neck aligned. Breathable bamboo-fiber cover, machine washable.',
      highlights: ['Gel-infused foam', 'Ergonomic contour', 'Bamboo cover', '5-year warranty'],
      price: 1499, mrp: 2299, images: [img('p-pillow')], category: cat['home-living'], brand: brand['haven'],
      stock: 60, sold: 150, tags: ['pillow', 'sleep', 'home'],
    },
    {
      name: 'Nova SoundBar S400 Dolby Atmos', slug: 'nova-soundbar-s400-dolby-atmos',
      description: '2.1.2-channel soundbar with wireless subwoofer, up-firing Atmos drivers and HDMI eARC. Cinema-grade sound in a slim profile.',
      highlights: ['Dolby Atmos 2.1.2', 'Wireless subwoofer', 'HDMI eARC', '400W peak output'],
      price: 18999, mrp: 24999, images: [img('p-soundbar')], category: cat['electronics'], brand: brand['nova'],
      stock: 14, sold: 85, isFeatured: true, tags: ['soundbar', 'audio', 'home theater'],
    },
    {
      name: 'Stride Everyday Cotton Hoodie', slug: 'stride-everyday-cotton-hoodie',
      description: 'Heavyweight 400 GSM brushed cotton hoodie with a relaxed fit, ribbed cuffs and a double-lined hood. Pre-shrunk and fade-resistant.',
      highlights: ['400 GSM cotton', 'Relaxed fit', 'Double-lined hood', 'Pre-shrunk'],
      price: 1999, mrp: 2999, images: [img('p-hoodie')], category: cat['fashion'], brand: brand['stride'],
      colors: ['Charcoal', 'Navy'], sizes: ['S', 'M', 'L', 'XL'],
      variants: [
        { color: 'Charcoal', size: 'M', stock: 15 }, { color: 'Charcoal', size: 'L', stock: 15 },
        { color: 'Navy', size: 'M', stock: 10 }, { color: 'Navy', size: 'L', stock: 10 },
      ],
      stock: 50, sold: 260, tags: ['hoodie', 'winter'],
    },
    {
      name: 'Pulse PowerFlex Adjustable Dumbbells (2–24kg)', slug: 'pulse-powerflex-adjustable-dumbbells',
      description: 'Space-saving adjustable dumbbell pair replacing 15 sets. Quick-dial weight selection from 2kg to 24kg per hand with a secure locking cradle.',
      highlights: ['2–24kg per hand', 'Quick-dial select', 'Replaces 15 sets', 'Anti-slip grip'],
      price: 24999, mrp: 32999, images: [img('p-dumbbells')], category: cat['sports'], brand: brand['pulse'],
      stock: 8, sold: 45, tags: ['gym', 'weights', 'fitness'],
    },
    {
      name: 'Haven Lumen Smart LED Floor Lamp', slug: 'haven-lumen-smart-led-floor-lamp',
      description: 'App-controlled floor lamp with 16M colors, music sync and scene presets. Works with Alexa and Google Home over Wi-Fi.',
      highlights: ['16M colors', 'Alexa & Google Home', 'Music sync', 'Memory function'],
      price: 5499, mrp: 6999, images: [img('p-lamp')], category: cat['home-living'], brand: brand['haven'],
      stock: 22, sold: 95, isFlashSale: true, flashSaleEndsAt: flashEnd, tags: ['lamp', 'smart home', 'decor'],
    },
  ]);

  await Banner.create([
    {
      title: 'Sound that moves with you', subtitle: 'Up to 40% off flagship audio — this week only',
      image: img('banner-hero-1', 1600, 700), link: '/products?category=' + cat['electronics'], ctaText: 'Shop Audio', position: 'hero', order: 0,
    },
    {
      title: 'New season, new stride', subtitle: 'Fresh fits and footwear from ₹999',
      image: img('banner-hero-2', 1600, 700), link: '/products?category=' + cat['fashion'], ctaText: 'Shop Fashion', position: 'hero', order: 1,
    },
  ]);

  await Coupon.create({
    code: 'WELCOME10', description: '10% off your first order (max ₹500)',
    discountType: 'percent', discountValue: 10, minOrderAmount: 999, maxDiscount: 500,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  });

  console.log('✅ Seed complete with Multi-User Demo Accounts:');
  console.log('   👑 Admin    → admin@luxora.shop   / Admin@12345');
  console.log('   🛍️ Customer → demo@luxora.shop    / Demo@12345');
  console.log('   🏪 Seller   → seller@luxora.shop  / Seller@12345');
  console.log('   👔 Manager  → manager@luxora.shop / Manager@12345');
  console.log('   🎟️ Coupon   → WELCOME10');
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
