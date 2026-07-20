import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../api/axios.js';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try { return (await api.get('/wishlist')).data.wishlist; } catch (e) { return rejectWithValue(e.message); }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue }) => {
  try { return (await api.post(`/wishlist/${productId}`)).data.wishlist; } catch (e) { return rejectWithValue(e.message); }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { wishlist: null, loading: false },
  reducers: { resetWishlist: (state) => { state.wishlist = null; } },
  extraReducers: (b) => {
    b.addCase(fetchWishlist.fulfilled, (s, a) => { s.wishlist = a.payload; })
      .addCase(toggleWishlist.fulfilled, (s, a) => { s.wishlist = a.payload; });
  },
});

export const { resetWishlist } = wishlistSlice.actions;

/** Memoized set of wishlisted product ids — only recomputes when the products array changes. */
export const selectWishlistIds = createSelector(
  [(state) => state.wishlist.wishlist?.products],
  (products) => new Set((products || []).map((p) => String(p._id || p)))
);

export default wishlistSlice.reducer;
