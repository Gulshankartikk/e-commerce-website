import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice.js';
import cartReducer from '../features/cartSlice.js';
import wishlistReducer from '../features/wishlistSlice.js';
import uiReducer from '../features/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    ui: uiReducer,
  },
});
