import { useEffect } from 'react';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';

/* Content for About / Privacy / Terms / Returns pages. */
const PAGES = {
  about: {
    title: 'About FlashShop',
    sections: [
      { h: 'Who we are', p: 'FlashShop is a curated AI-powered e-commerce store built around one idea: fewer, better products. Instead of listing everything, we hand-pick electronics, fashion, home and fitness gear that clears our quality bar — then negotiate prices worth your attention.' },
      { h: 'What we stand for', p: 'Honest product pages with real photos and verified reviews. Transparent pricing with taxes included. Fast dispatch from regional warehouses, and an AI Shopping Copilot that assists your decision making.' },
      { h: 'Our promise', p: 'Every order is backed by a 7-day no-questions return window, secure payments, and doorstep pickup for returns. If something goes wrong, we make it right — that is the whole policy.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { h: 'Data we collect', p: 'We collect the information you provide directly: your name, email, delivery addresses, and order history. Payment card details are processed by our payment partners (Stripe, Razorpay) and never touch our servers.' },
      { h: 'How we use it', p: 'Your data is used to fulfil orders, provide support, and — only if you opt in — send offers by email. We never sell personal data to third parties. Order data is retained for tax and warranty purposes as required by law.' },
      { h: 'Cookies & sessions', p: 'We use a single authentication cookie to keep you signed in and local storage for preferences like theme. No third-party advertising trackers run on this site.' },
      { h: 'Your rights', p: 'You may request a copy or deletion of your personal data at any time by writing to privacy@flashshop.com. Account deletion removes your profile, addresses and wishlist; order records are anonymized.' },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      { h: 'Using FlashShop', p: 'By creating an account you confirm you are at least 18 years old or shopping under adult supervision. You are responsible for keeping your login credentials confidential.' },
      { h: 'Orders & pricing', p: 'All prices are listed in Indian Rupees and include GST. An order is confirmed only after payment authorisation (or COD verification). We reserve the right to cancel orders affected by pricing errors, with a full refund.' },
      { h: 'Delivery', p: 'Standard delivery takes 4–6 business days; express delivery takes 1–2. Risk in the goods passes to you on delivery. Please inspect packages before accepting visibly damaged shipments.' },
      { h: 'Liability', p: 'Products carry their manufacturer warranty where stated. Our liability for any claim is limited to the amount paid for the product in question.' },
    ],
  },
  returns: {
    title: 'Return Policy',
    sections: [
      { h: '7-day easy returns', p: 'Most items can be returned within 7 days of delivery for a full refund — unused, with tags and original packaging. Start a return from My Orders and we will arrange doorstep pickup.' },
      { h: 'Non-returnable items', p: 'For hygiene reasons, earphones with opened seals, innerwear, and personal-care items cannot be returned unless defective on arrival.' },
      { h: 'Refund timelines', p: 'Refunds are issued to the original payment method within 5–7 business days after the returned item passes inspection. COD orders are refunded via bank transfer or store credit — your choice.' },
      { h: 'Damaged or wrong items', p: 'If your order arrives damaged or incorrect, contact us within 48 hours with photos. We will ship a replacement immediately or refund in full, including shipping.' },
    ],
  },
};

/** Renders one of the static content pages. */
export default function StaticPage({ page }) {
  const content = PAGES[page];
  useEffect(() => { document.title = `${content.title} — FlashShop`; }, [content]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: content.title }]} />
      <h1 className="section-title mb-8">{content.title}</h1>
      <div className="space-y-8">
        {content.sections.map((s) => (
          <section key={s.h} className="card-surface p-6">
            <h2 className="mb-2 text-lg font-bold text-[#202923]">{s.h}</h2>
            <p className="text-sm leading-relaxed text-[#65716A]">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
