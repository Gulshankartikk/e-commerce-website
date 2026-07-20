import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Rating from '../ui/Rating.jsx';
import { setQuickView } from '../../features/uiSlice.js';
import { addToCart } from '../../features/cartSlice.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

/** Global quick-view modal driven by ui.quickViewProduct. */
export default function QuickViewModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const product = useSelector((s) => s.ui.quickViewProduct);
  const user = useSelector((s) => s.auth.user);
  const [qty, setQty] = useState(1);

  const close = () => { dispatch(setQuickView(null)); setQty(1); };

  const handleAdd = async () => {
    if (!user) { toast('Sign in to continue', { icon: '🔐' }); navigate('/login'); close(); return; }
    if (product.colors?.length > 1 || product.sizes?.length) {
      navigate(`/product/${product.slug}`); close(); return;
    }
    const res = await dispatch(addToCart({ productId: product._id, quantity: qty }));
    if (res.error) toast.error(res.payload);
    else { toast.success('Added to cart'); close(); }
  };

  if (!product) return null;
  return (
    <Modal open={Boolean(product)} onClose={close} title="Quick view">
      <div className="grid gap-6 sm:grid-cols-2">
        <img src={imgUrl(product.images?.[0]?.url)} alt={product.name} className="aspect-square w-full rounded-xl object-cover" />
        <div>
          <h2 className="text-lg font-bold">{product.name}</h2>
          <div className="mt-2"><Rating value={product.ratingsAverage} count={product.ratingsCount} /></div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-secondary-400">{formatPrice(product.price)}</span>
            {product.mrp > product.price && <span className="text-sm text-slate-500 line-through">{formatPrice(product.mrp)}</span>}
          </div>
          <p className="mt-3 text-sm text-slate-400">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-600">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:text-primary-300" aria-label="Decrease quantity">−</button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(10, qty + 1))} className="px-3 py-2 hover:text-primary-300" aria-label="Increase quantity">+</button>
            </div>
            <button onClick={handleAdd} disabled={product.stock === 0} className="btn-primary flex-1">Add to cart</button>
          </div>
          <button onClick={() => { navigate(`/product/${product.slug}`); close(); }} className="btn-outline mt-3 w-full">View full details</button>
        </div>
      </div>
    </Modal>
  );
}
