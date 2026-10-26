import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSend } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import toast from 'react-hot-toast';

/** Site footer: newsletter, link columns, socials, legal. */
export default function Footer() {
  const [email, setEmail] = useState('');

  const subscribe = (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error('Please enter a valid email'); return; }
    toast.success('Subscribed! Watch your inbox for deals');
    setEmail('');
  };

  const columns = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', to: '/products' },
        { label: 'Flash Sale', to: '/products?flashSale=true' },
        { label: 'Featured', to: '/products?featured=true' },
        { label: 'Compare', to: '/compare' },
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
    <footer className="mt-16 border-t border-white/10 bg-card/50">
      {/* Newsletter band */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="card-surface flex flex-col items-center gap-4 !rounded-3xl bg-gradient-to-r from-primary/20 via-card to-secondary-500/10 p-8 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h3 className="text-xl font-bold">Get deals before anyone else</h3>
            <p className="mt-1 text-sm text-slate-400">Flash-sale alerts and member-only coupons. No spam, unsubscribe anytime.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-sm gap-2">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" aria-label="Email for newsletter" className="input-field flex-1"
            />
            <button type="submit" className="btn-primary !px-4" aria-label="Subscribe"><FiSend /></button>
          </form>
        </div>

        {/* Link columns */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-rose-500 text-white shadow-md">⚡</span>
              <span><span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">FLASH</span>SHOP</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              AI-powered modern shopping with live catalog copilot, curated fashion, audio and home gear.
            </p>
            <div className="mt-4 flex gap-3">
              {[FaFacebookF, FaInstagram, FaXTwitter, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 transition-all hover:border-primary hover:text-primary-300 hover:shadow-glow">
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-slate-300">{col.title}</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to} className="transition-colors hover:text-primary-300">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} FlashShop. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-primary-300">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-primary-300">Terms & Conditions</Link>
            <Link to="/returns" className="transition-colors hover:text-primary-300">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
