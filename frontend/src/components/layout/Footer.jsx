import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSend, IconFacebook, IconTwitter, IconInstagram, IconYoutube } from '../ui/icons.jsx';
import toast from 'react-hot-toast';

/** Site footer styled in clean soft mint and deep emerald. */
export default function Footer() {
  const [email, setEmail] = useState('');

  const subscribe = (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error('Please enter a valid email'); return; }
    toast.success('Subscribed! Watch your inbox for exclusive electronics deals');
    setEmail('');
  };

  const columns = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', to: '/products' },
        { label: 'Flash Sale', to: '/products?flashSale=true' },
        { label: 'Featured Gear', to: '/products?featured=true' },
        { label: 'Compare Products', to: '/compare' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'My Account', to: '/dashboard' },
        { label: 'My Orders', to: '/dashboard/orders' },
        { label: 'Wishlist', to: '/wishlist' },
        { label: 'Cart', to: '/cart' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Contact Us', to: '/contact' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Return Policy', to: '/returns' },
        { label: 'About Us', to: '/about' },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-[#E4EAE6] bg-[#F1F7F4]">
      {/* Newsletter Band */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-white border border-[#E4EAE6] p-8 sm:p-10 shadow-[0_4px_18px_rgba(21,61,43,0.05)] md:flex-row md:justify-between">
          <div className="max-w-md">
            <h3 className="font-display text-2xl font-bold text-[#202923]">Get deals before anyone else</h3>
            <p className="mt-1.5 text-sm text-[#65716A]">
              Exclusive flash-sale alerts and subscriber-only coupons. No spam, unsubscribe anytime.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-sm gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email for newsletter"
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary !px-5" aria-label="Subscribe">
              <IconSend size={18} />
            </button>
          </form>
        </div>

        {/* Link Columns */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087F65] text-white shadow-sm text-sm">
                ⚡
              </span>
              <span className="text-[#075E4B] font-extrabold text-xl">
                FLASH<span className="text-[#087F65]">SHOP</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#65716A]">
              Technology within everyone's reach. Discover the latest electronics, smart devices, and accessories at prices you'll love.
            </p>
            <div className="mt-5 flex gap-2.5">
              {[
                { Icon: IconFacebook, href: 'https://facebook.com', label: 'FlashShop on Facebook' },
                { Icon: IconInstagram, href: 'https://instagram.com', label: 'FlashShop on Instagram' },
                { Icon: IconTwitter, href: 'https://twitter.com', label: 'FlashShop on X' },
                { Icon: IconYoutube, href: 'https://youtube.com', label: 'FlashShop on YouTube' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4EAE6] bg-white text-[#65716A] transition-all hover:border-[#087F65] hover:text-[#087F65] hover:bg-[#EAF4EF]"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-[#202923]">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm text-[#65716A]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="transition-colors hover:text-[#087F65]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Bar */}
      <div className="border-t border-[#E4EAE6] bg-[#EAF4EF] py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-[#65716A] sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} FlashShop. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-[#087F65]">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-[#087F65]">Terms & Conditions</Link>
            <Link to="/faq" className="transition-colors hover:text-[#087F65]">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
