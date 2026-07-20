import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../api/axios.js';

/* All cart mutations return the same { cart, totals } shape from the API. */
const thunk = (name, fn) =>
  createAsyncThunk(`cart/${name}`, async (arg, { rejectWithValue }) => {
    try { return (await fn(arg)).data; } catch (e) { return rejectWithValue(e.message); }
  });

export const fetchCart = thunk('fetch', () => api.get('/cart'));
export const addToCart = thunk('add', (body) => api.post('/cart', body));
export const updateCartItem = thunk('update', ({ itemId, quantity }) => api.put(`/cart/${itemId}`, { quantity }));
export const removeCartItem = thunk('remove', (itemId) => api.delete(`/cart/${itemId}`));
export const toggleSaveForLater = thunk('sfl', (itemId) => api.put(`/cart/${itemId}/save-for-later`));
export const applyCoupon = thunk('coupon', (code) => api.post('/cart/coupon', { code }));
export const removeCoupon = thunk('rmCoupon', () => api.delete('/cart/coupon'));
export const clearCart = thunk('clear', () => api.delete('/cart'));

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, totals: null, loading: false, error: null },
  reducers: {
    resetCart: (state) => { state.cart = null; state.totals = null; },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher((a) => a.type.startsWith('cart/') && a.type.endsWith('/pending'), (state) => { state.loading = true; state.error = null; })
      .addMatcher((a) => a.type.startsWith('cart/') && a.type.endsWith('/fulfilled'), (state, action) => {
        state.loading = false;
        state.cart = action.payload.cart;
        state.totals = action.payload.totals;
      })
      .addMatcher((a) => a.type.startsWith('cart/') && a.type.endsWith('/rejected'), (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  },
});

export const { resetCart } = cartSlice.actions;

/** Memoized count of active (not saved-for-later) items. */
export const selectCartCount = createSelector(
  [(state) => state.cart.cart?.items],
  (items) => (items || []).filter((i) => !i.savedForLater).reduce((s, i) => s + i.quantity, 0)
);

export default cartSlice.reducer;
