import fs from 'fs';
import path from 'path';

const IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/nova-airbeat-pro.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/nova-airbeat-pro-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/pulse-vitals-x2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/pulse-vitals-x2-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/stride-velocity.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/stride-velocity-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/haven-pillow.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/nova-soundbar.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/stride-hoodie.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/pulse-dumbbells.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/products/haven-lamp.jpg',
  },
  // Categories
  {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/categories/cat-electronics.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/categories/cat-fashion.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/categories/cat-home.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/categories/cat-sports.jpg',
  },
  // Hero Banners
  {
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/banners/banner-audio.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    dest: 'frontend/public/images/banners/banner-fashion.jpg',
  },
];

async function downloadAll() {
  console.log('🚀 Downloading product & category images to local storage...');
  for (const item of IMAGES) {
    try {
      const dir = path.dirname(item.dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(item.dest, buffer);

      // Also copy to backend/uploads
      const filename = path.basename(item.dest);
      const backendCopy = path.join('backend/uploads', filename);
      fs.writeFileSync(backendCopy, buffer);

      console.log(`  ✅ Saved: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
    } catch (err) {
      console.error(`  ❌ Failed: ${item.dest} - ${err.message}`);
    }
  }
  console.log('🎉 All images downloaded successfully and stored locally!');
}

downloadAll();
