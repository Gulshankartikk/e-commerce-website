import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiPhone, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';

/** Contact page with a validated form (front-end only submission acknowledgment). */
export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  useEffect(() => { document.title = 'Contact — FlashShop'; }, []);

  const onSubmit = async () => {
    // Simulate a short send; hooks into a support-ticket API when one is configured
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Message sent! We'll reply within 24 hours.");
    reset();
  };

  const channels = [
    { icon: FiMail, label: 'Email', value: 'support@flashshop.com', sub: 'Replies within 24 hours' },
    { icon: FiPhone, label: 'Phone', value: '1800-120-4567', sub: 'Mon–Sat, 9am–7pm IST' },
    { icon: FiMessageCircle, label: 'Chat', value: 'Live chat', sub: 'From the Help widget, 24×7' },
    { icon: FiMapPin, label: 'Office', value: 'HSR Layout, Bengaluru 560102', sub: 'Karnataka, India' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <h1 className="section-title mb-8">We're here to help</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {channels.map((c) => (
            <div key={c.label} className="card-surface flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-primary-300"><c.icon /></span>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{c.label}</p>
                <p className="font-semibold">{c.value}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-surface space-y-4 p-6">
          <h2 className="text-lg font-bold">Send us a message</h2>
          <div>
            <input placeholder="Your name" className="input-field" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <input type="email" placeholder="Your email" className="input-field"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' } })} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <input placeholder="Order number (optional)" className="input-field" {...register('orderNumber')} />
          </div>
          <div>
            <textarea placeholder="How can we help?" rows="5" className="input-field resize-none"
              {...register('message', { required: 'Please write a message', minLength: { value: 10, message: 'Tell us a bit more (10+ characters)' } })} />
            {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">{isSubmitting ? 'Sending…' : 'Send message'}</button>
        </form>
      </div>
    </div>
  );
}
