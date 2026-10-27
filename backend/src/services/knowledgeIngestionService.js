import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { chunkDocumentText } from '../utils/chunking.js';
import { getEmbeddingsBatch } from './embeddingService.js';

/**
 * FlashShop Canonical Knowledge Documents Corpus
 * Stores rich ground-truth policies, FAQs, and product technical specifications.
 */
export const CANONICAL_KNOWLEDGE_DOCS = [
  {
    sourceId: 'doc_returns_policy_v1',
    title: 'FlashShop 15-Day Return & Refund Policy',
    documentType: 'policy',
    url: '/policies/returns',
    version: '1.0.0',
    metadata: {
      category: 'Customer Service & Policies',
      effectiveDate: new Date('2026-01-01'),
      tags: ['returns', 'refunds', 'window', 'remorse', 'damaged'],
      author: 'FlashShop Operations',
    },
    content: `# FlashShop 15-Day Return & Refund Policy

## Eligibility Window
At FlashShop, we offer a customer-friendly 15-day return window starting from the date of package delivery. If you are not completely satisfied with your purchase, you may initiate a return directly from your Account Dashboard under "My Orders".

## Condition Requirements
To be eligible for a full return:
- Products must be unused, unwashed, and in their original packaging with all tags, accessories, manuals, and warranty cards intact.
- Electronics (earbuds, smartwatches, audio equipment) must be in pristine cosmetic condition with all charging cables and packaging included.
- Footwear must be tried indoors only on clean surfaces and returned in the original shoebox.

## Return Shipping Fees
- **Defective or Incorrect Items**: If you received a defective, damaged, or incorrect item, FlashShop covers 100% of the return pickup logistics cost.
- **Buyer Remorse / Voluntary Returns**: For voluntary returns (e.g., changed mind or ordered wrong color), a nominal fee of ₹100 is deducted from the refund total to cover reverse shipping logistics.

## Refund Timelines and Payment Methods
Once the returned package reaches our fulfillment hub and passes quality inspection (usually within 24–48 hours of receipt):
- **Prepaid Orders (Cards, Net Banking, UPI)**: Refunds are credited back to the original source account within 3 to 5 business days.
- **Cash on Delivery (COD) Orders**: Refunds are issued as instant FlashShop Store Credit, or deposited directly into your verified bank account via NEFT/UPI within 3 business days of providing bank details.

## Non-Returnable Items
The following categories cannot be returned for hygiene and safety reasons:
- Personalized or custom-engraved merchandise.
- Intimate wear and base layers once unsealed.
- Items marked as "Final Clearance" on the product detail page.`,
  },
  {
    sourceId: 'doc_shipping_policy_v1',
    title: 'FlashShop Shipping, Delivery & Tracking Guidelines',
    documentType: 'shipping',
    url: '/policies/shipping',
    version: '1.0.0',
    metadata: {
      category: 'Logistics',
      effectiveDate: new Date('2026-01-01'),
      tags: ['shipping', 'delivery', 'express', 'fees', 'free shipping', 'tracking'],
      author: 'FlashShop Logistics',
    },
    content: `# FlashShop Shipping, Delivery & Tracking Guidelines

## Shipping Rates & Free Shipping Threshold
- **Free Standard Shipping**: FlashShop provides 100% free standard delivery on all domestic orders totaling ₹999 or more after any applied coupons.
- **Standard Shipping Fee**: For orders under ₹999, a flat standard shipping fee of ₹99 is added at checkout.
- **Express 2-Day Air Delivery**: Express 2-day delivery is available for select pin codes at a flat rate of ₹199, regardless of cart value.

## Dispatch & Transit Timelines
- All in-stock orders placed before 3:00 PM IST Monday through Saturday are dispatched from our automated warehouse within 24 hours.
- **Metro Cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata)**: Typically delivered within 2 to 3 business days.
- **Tier 2 and Tier 3 Cities**: Delivered within 4 to 6 business days.
- **Remote / Special Regions (J&K, Northeast)**: Delivered within 6 to 8 business days.

## Order Tracking
As soon as your shipment is dispatched, you will receive an automated tracking link via SMS and registered email. You can also monitor live real-time status under your FlashShop account profile.

## Damaged or Tampered Shipments
If the outer courier parcel arrives visibly opened, punctured, or tampered with:
- Refuse delivery and ask the delivery executive to mark the package as "Damaged Parcel Rejected".
- Or record a brief unboxing video upon opening. Notify our customer support within 24 hours with your order number.`,
  },
  {
    sourceId: 'doc_warranty_policy_v1',
    title: 'FlashShop Comprehensive 1-Year Hardware Warranty',
    documentType: 'warranty',
    url: '/policies/warranty',
    version: '1.0.0',
    metadata: {
      category: 'Warranty & Support',
      effectiveDate: new Date('2026-01-01'),
      tags: ['warranty', 'repairs', 'coverage', 'replacement', 'electronics'],
      author: 'FlashShop Quality Engineering',
    },
    content: `# FlashShop Comprehensive 1-Year Hardware Warranty

## Warranty Coverage
All FlashShop electronics and smart gadgets (including Nova audio products and Pulse smartwatches) include a complimentary **1-Year Comprehensive Manufacturer Warranty** starting from the delivery date.

## What Is Covered
- Internal component failures, audio driver malfunctions, and microphone defects under normal use.
- Bluetooth connectivity failures and mainboard circuit defects.
- Battery degradation where capacity drops below 70% within the 1-year period.
- Charging dock and magnetic pin charging defects.

## What Is NOT Covered
- Physical accidental damage, casing cracks, drops, and cosmetic wear and tear.
- Water submersion exceeding the stated IP rating (e.g., submerged deeper or longer than rated).
- Disassembly, modifications, or repair attempts by unauthorized third-party technicians.
- Normal cosmetic scratches on displays, housings, or cables.

## Warranty Claim Process
To file a warranty claim:
1. Email support@flashshop.com with your Order ID and a 30-second video illustrating the fault.
2. Our technical team responds within 24 business hours with troubleshooting steps or a complimentary reverse pickup courier label.
3. Once inspected at our repair facility, we will repair the item or provide a brand-new replacement unit within 5 to 7 business days.`,
  },
  {
    sourceId: 'doc_payment_security_v1',
    title: 'FlashShop Payment Methods, COD & Security Safeguards',
    documentType: 'policy',
    url: '/policies/payments',
    version: '1.0.0',
    metadata: {
      category: 'Payments & Security',
      effectiveDate: new Date('2026-01-01'),
      tags: ['payments', 'cod', 'upi', 'stripe', 'razorpay', 'security'],
      author: 'FlashShop Finance',
    },
    content: `# FlashShop Payment Methods, COD & Security Safeguards

## Supported Payment Gateways
FlashShop partners with industry-leading, RBI-authorized, PCI-DSS Level 1 compliant payment partners:
- **Unified Payments Interface (UPI)**: Instant payment via Google Pay, PhonePe, Paytm, BHIM, or any banking UPI app.
- **Credit & Debit Cards**: Visa, MasterCard, RuPay, and American Express. 3D Secure OTP verification is required for all card transactions.
- **Net Banking**: Supported across all major Indian retail and corporate banks.
- **Cash on Delivery (COD)**: Available on cart values up to ₹10,000 across serviceable postal codes.

## Zero Card Data Storage
FlashShop never stores your credit card numbers, CVV, or banking passwords on our internal servers. All card payment tokens are handled directly by PCI-compliant gateways (Stripe and Razorpay) using end-to-end 256-bit AES encryption.

## COD Order Verification
To safeguard against fraudulent orders and automated bots, COD orders may trigger a quick one-time SMS verification or confirmation notification before dispatch.

## Failed Transactions & Automatic Reversal
If your payment is debited from your bank account but your FlashShop order confirmation is not generated due to network disruption, your bank will automatically reverse the funds within 24 to 48 hours according to standard banking clearing cycles.`,
  },
  {
    sourceId: 'doc_faq_general_v1',
    title: 'FlashShop Frequently Asked Questions (Store FAQ)',
    documentType: 'faq',
    url: '/faq',
    version: '1.0.0',
    metadata: {
      category: 'FAQ',
      effectiveDate: new Date('2026-01-01'),
      tags: ['faq', 'invoice', 'coupons', 'tracking', 'discounts', 'account'],
      author: 'FlashShop Support Team',
    },
    content: `# FlashShop Frequently Asked Questions (Store FAQ)

## How do I apply promo discount coupons?
To redeem a discount code (such as WELCOME10 for 10% off):
1. Add your desired products to the shopping cart.
2. Open the Cart page or Slide-out Drawer.
3. Enter the coupon code into the "Apply Coupon" input field and click Apply.
4. The discount is applied immediately to your order subtotal. Note: Only one coupon can be applied per checkout order.

## Where can I download my tax invoice?
Official GST tax invoices are automatically generated as soon as your order is confirmed. To download:
1. Log in and navigate to "My Orders" from your profile menu.
2. Select your Order Details.
3. Click the "Download PDF Invoice" button at the top right of the order summary.

## Can I modify or cancel my order after placing it?
You can cancel your order at any time before the status changes to "Shipped" from your Orders page. Once shipped, packages cannot be cancelled mid-transit, but you may refuse delivery or request a standard return upon arrival.

## Does FlashShop ship internationally?
Currently, FlashShop ships exclusively to delivery addresses located within the Republic of India. We do not support overseas international shipments at this time.`,
  },
  {
    sourceId: 'doc_prod_nova_airbeat_pro',
    title: 'Nova AirBeat Pro Wireless Earbuds — Technical Specification & User Manual',
    documentType: 'product_doc',
    url: '/product/nova-airbeat-pro-wireless-earbuds',
    version: '1.0.0',
    metadata: {
      category: 'Electronics - Audio',
      effectiveDate: new Date('2026-01-01'),
      tags: ['nova', 'earbuds', 'anc', 'battery', 'waterproof', 'bluetooth'],
      author: 'Nova Audio Labs',
    },
    content: `# Nova AirBeat Pro Wireless Earbuds Technical Guide

## Audio Architecture & Active Noise Cancellation
- **Driver**: Custom 11mm Titanium-coated dynamic neodymium drivers.
- **Active Noise Cancellation (ANC)**: Hybrid feedforward and feedback dual-mic ANC cancelling up to 40dB of ambient ambient background rumble (airplane cabin, train, office chatter).
- **Transparency Mode**: One-tap ambient awareness mode amplifies natural external voices and traffic sounds without removing earbuds.
- **Microphones**: 4-mic array with ENC (Environmental Noise Cancellation) and AI wind-suppression algorithm for crystal clear voice calls.

## Battery Life & Fast Charging
- **Earbud Playback Time**: Up to 9 hours on a single charge with ANC off (7 hours with ANC enabled).
- **Combined Case Playback**: Total 45 hours of playtime using the portable USB-C fast-charging case.
- **Fast Charge Technology**: 10 minutes of charging delivers 5 full hours of music playback.
- **Charging Interface**: Reversible USB Type-C port (supports standard 5V/1A or 5V/2A adapters).

## Connectivity & Durability
- **Bluetooth Version**: Bluetooth 5.3 with multipoint dual-device connectivity (effortlessly transition between laptop and smartphone).
- **Latency**: Ultra-low 48ms gaming mode minimizes audio lag during streaming and mobile gaming.
- **Water & Sweat Resistance**: IPX5 rated against gym sweat, intense rain, and water splashes (not rated for swimming).
- **Weight**: 4.6 grams per earbud; case weight 42 grams.`,
  },
  {
    sourceId: 'doc_prod_pulse_vitals_x2',
    title: 'Pulse Vitals X2 Smartwatch — Technical Specifications & Sensor Guide',
    documentType: 'product_doc',
    url: '/product/pulse-vitals-x2-smartwatch',
    version: '1.0.0',
    metadata: {
      category: 'Electronics - Wearables',
      effectiveDate: new Date('2026-01-01'),
      tags: ['pulse', 'smartwatch', 'amoled', 'gps', 'waterproof', 'sensors'],
      author: 'Pulse Wearable Technologies',
    },
    content: `# Pulse Vitals X2 Smartwatch Technical Guide

## Display & Build
- **Screen**: 1.43-inch Ultra HD AMOLED display with 466 x 466 resolution and 326 PPI.
- **Brightness**: 600 nits peak outdoor brightness with ambient light auto-dimming.
- **Always-On Display (AOD)**: Customizable analog and digital AOD watch faces.
- **Chassis**: Aerospace-grade zinc alloy unibody with ceramic rear sensor housing and breathable liquid silicone strap.

## Biometric Sensors & Health Tracking
- **Heart Rate**: 24/7 continuous optical PPG sensor with abnormal high/low pulse vibration alerts.
- **Blood Oxygen (SpO2)**: Real-time red & infrared photodiode sensor with sleep apnea monitoring.
- **Sleep Quality**: REM, deep sleep, light sleep, and awake time stages with recovery readiness score.
- **Stress & Breath**: Heart rate variability (HRV) stress indexing with guided breathing sessions.

## Connectivity, GPS & Battery
- **Satellite Tracking**: Onboard independent multi-system GNSS (GPS, GLONASS, Galileo) for accurate outdoor distance without carrying a phone.
- **Water Resistance**: 5ATM (50 meters) water resistance — fully certified for open water and pool swimming.
- **Battery Life**: 7 days of typical use, 4 days under heavy multi-workout tracking with AOD, and up to 14 days in battery saver mode.
- **Compatibility**: Android 8.0+ and iOS 13.0+ via the companion mobile sync app.`,
  },
  {
    sourceId: 'doc_prod_stride_velocity_runner',
    title: 'Stride Velocity Running Shoes — Cushioning, Fit & Material Specs',
    documentType: 'product_doc',
    url: '/product/stride-velocity-running-shoes',
    version: '1.0.0',
    metadata: {
      category: 'Fashion & Footwear',
      effectiveDate: new Date('2026-01-01'),
      tags: ['stride', 'shoes', 'running', 'cushioning', 'fit', 'breathable'],
      author: 'Stride Athletic Footwear Lab',
    },
    content: `# Stride Velocity Running Shoes Specifications

## Midsole Cushioning & Energy Return
- **Cushioning Foam**: Proprietary AeroFoam Dual-Density EVA midsole provides 65% energy rebound with shock dissipation on road impact.
- **Drop / Offset**: 8mm heel-to-toe drop (28mm heel / 20mm forefoot) ideal for neutral runners, midfoot strikers, and daily marathon training.
- **Insole**: High-resilience open-cell PU footbed that is fully removable to accommodate custom orthopedic insoles.

## Upper Construction & Breathability
- **Material**: Engineered dual-layer breathable jacquard mesh with micro-perforated cooling zones across the toe box.
- **Heel Counter**: Ergonomic molded TPU heel collar locks the heel in place to eliminate slippage and protect the Achilles tendon.
- **Outsole**: High-abrasion blown rubber pods strategically zoned along high-wear heel strike and toe-off vectors for traction in wet and dry conditions.

## Sizing & Fit Recommendations
- **Fit Profile**: True to standard Indian and UK sizing.
- **Wide Feet**: If you have wider feet (EE width) or prefer thicker athletic running socks, we recommend choosing one half-size up for optimal toe-splay room.`,
  },
  {
    sourceId: 'doc_prod_haven_lamp',
    title: 'Haven Lumen Smart LED Floor Lamp — Lumens, Connectivity & Lighting Modes',
    documentType: 'product_doc',
    url: '/product/haven-lumen-smart-led-floor-lamp',
    version: '1.0.0',
    metadata: {
      category: 'Home & Living',
      effectiveDate: new Date('2026-01-01'),
      tags: ['haven', 'lamp', 'smart home', 'led', 'alexa', 'google home'],
      author: 'Haven Home Decor',
    },
    content: `# Haven Lumen Smart LED Floor Lamp Specifications

## Lighting Performance & Color Range
- **Brightness**: 1800 Lumens peak output with 1% to 100% stepless smooth flicker-free dimming.
- **Color Spectrum**: 16 Million RGB colors plus tunable white spectrum from 2200K (ultra-warm candle) to 6500K (crisp daylight).
- **Color Rendering Index (CRI)**: Ra ≥ 92 for true-to-life vibrant color rendering without eye strain.

## Smart Connectivity & Automation
- **Wireless Protocols**: Wi-Fi 2.4GHz and Bluetooth Low Energy (BLE) fast pairing.
- **Voice Control Assistants**: Native integration with Google Assistant and Amazon Alexa for hands-free voice commands.
- **Circadian Rhythm Mode**: Automatically adjusts color temperature and brightness throughout the day to support healthy melatonin and sleep cycles.
- **Physical Controls**: Touch-sensitive capacitive controls on the lamp pole for power, brightness, and scene switching without needing your phone.`,
  },
  {
    sourceId: 'doc_prod_pulse_powerflex_dumbbells',
    title: 'Pulse PowerFlex Adjustable Dumbbells — Mechanism, Weights & Safety Locks',
    documentType: 'product_doc',
    url: '/product/pulse-powerflex-adjustable-dumbbells',
    version: '1.0.0',
    metadata: {
      category: 'Sports & Fitness',
      effectiveDate: new Date('2026-01-01'),
      tags: ['pulse', 'dumbbells', 'fitness', 'weights', 'gym', 'adjustable'],
      author: 'Pulse Fitness Engineering',
    },
    content: `# Pulse PowerFlex Adjustable Dumbbells Specifications

## Weight Adjustment System
- **Weight Range**: Replaces 15 pairs of traditional dumbbells in a single compact set, adjusting from 2.5 kg to 24 kg per dumbbell.
- **Weight Steps**: 2.5, 3.5, 4.5, 5.5, 6.5, 8, 9, 10, 11.5, 13.5, 16, 18, 20.5, 22.5, and 24 kg.
- **Adjustment Mechanism**: Patented smooth-turn dial mechanism at each end selects target weight in under 3 seconds.

## Materials & Safety Lock
- **Core Plates**: Heavy-duty laser-cut solid steel core encased in high-impact molding to eliminate metal clanking and prevent floor scratches.
- **Safety Interlock**: Mechanical interlocking pins prevent plates from detaching or shifting during lifts unless securely docked in the base cradle.
- **Grip**: Textured knurled chrome steel handle with anti-slip contour for sweaty palms.`,
  },
  {
    sourceId: 'doc_prod_haven_pillow',
    title: 'Haven CloudRest Memory Foam Pillow — Ergonomics & Care Instructions',
    documentType: 'product_doc',
    url: '/product/haven-cloudrest-memory-foam-pillow',
    version: '1.0.0',
    metadata: {
      category: 'Home & Living',
      effectiveDate: new Date('2026-01-01'),
      tags: ['haven', 'pillow', 'memory foam', 'orthopedic', 'cooling gel', 'sleep'],
      author: 'Haven Sleep Science',
    },
    content: `# Haven CloudRest Memory Foam Pillow Guide

## Ergonomic Orthopedic Design
- **Core**: High-density slow-rebound memory foam that contours to the cervical curve of your neck and spine.
- **Dual-Height Contour**: Features a 12cm high contour for side sleepers and a 10cm low contour for back and stomach sleepers.
- **Cooling Technology**: Infused phase-change cooling gel layer dissipates trapped body heat for a cool, sweat-free night.

## Cover Materials & Maintenance
- **Removable Outer Cover**: Crafted from 40% sustainable bamboo fiber and 60% breathable polyester.
- **Washing Instructions**: Outer cover is 100% machine washable on delicate cycle with cold water.
- **Important**: The inner memory foam core should NEVER be submerged in water or placed in a washing machine. Spot-clean with a damp cloth if needed and air dry in shade.`,
  },
];

/**
 * Ingests a single document: chunks it, generates embeddings, and saves to MongoDB.
 */
export async function ingestDocument(docData) {
  // Upsert the canonical KnowledgeDocument
  const doc = await KnowledgeDocument.findOneAndUpdate(
    { sourceId: docData.sourceId },
    {
      sourceId: docData.sourceId,
      title: docData.title,
      documentType: docData.documentType,
      url: docData.url,
      version: docData.version || '1.0.0',
      content: docData.content,
      metadata: docData.metadata || {},
      isActive: docData.isActive !== false,
    },
    { upsert: true, new: true }
  );

  // Generate chunks
  const rawChunks = chunkDocumentText(docData.content, {
    maxChunkChars: 650,
    overlapChars: 120,
    minChunkChars: 80,
  });

  // Remove existing chunks for this sourceId
  await KnowledgeChunk.deleteMany({ sourceId: docData.sourceId });

  // Generate embeddings for all chunks in batch
  const textsToEmbed = rawChunks.map((c) => `${docData.title}\n${c.content}`);
  const embeddings = await getEmbeddingsBatch(textsToEmbed);

  // Create chunk documents
  const chunkDocs = rawChunks.map((c, idx) => ({
    chunkId: `${docData.sourceId}_c${idx}`,
    document: doc._id,
    sourceId: docData.sourceId,
    chunkIndex: c.chunkIndex,
    title: docData.title,
    documentType: docData.documentType,
    url: docData.url,
    content: c.content,
    tokenCount: c.tokenCount,
    embedding: embeddings[idx],
    embeddingModel: 'gemini-embedding-001',
    embeddingDimension: embeddings[idx]?.length || 768,
    metadata: {
      version: docData.version || '1.0.0',
      effectiveDate: docData.metadata?.effectiveDate || new Date(),
      sectionHeading: c.sectionHeading,
      tags: docData.metadata?.tags || [],
    },
    isActive: docData.isActive !== false,
  }));

  if (chunkDocs.length > 0) {
    await KnowledgeChunk.insertMany(chunkDocs);
  }

  doc.chunkCount = chunkDocs.length;
  await doc.save();

  return { document: doc, chunkCount: chunkDocs.length };
}

/**
 * Ingests all canonical documents into the database.
 */
export async function ingestAllKnowledgeDocuments() {
  console.log(`📚 Ingesting ${CANONICAL_KNOWLEDGE_DOCS.length} canonical knowledge documents...`);
  let totalChunks = 0;
  const results = [];

  for (const docData of CANONICAL_KNOWLEDGE_DOCS) {
    const res = await ingestDocument(docData);
    results.push(res);
    totalChunks += res.chunkCount;
    console.log(`  ✓ Indexed "${docData.title}" (${res.chunkCount} chunks)`);
  }

  console.log(`✅ Ingestion complete: ${results.length} documents, ${totalChunks} chunks indexed with 768-d embeddings.`);
  return { documentCount: results.length, totalChunks, results };
}
