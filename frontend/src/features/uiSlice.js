import { createSlice } from '@reduxjs/toolkit';

/* Theme persists in localStorage; <html> class drives Tailwind dark/light. */
const savedTheme = localStorage.getItem('lx_theme') || 'dark';
document.documentElement.classList.toggle('light', savedTheme === 'light');
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: savedTheme,
    quickViewProduct: null, // product object shown in the QuickView modal
    compareItems: JSON.parse(localStorage.getItem('lx_compare') || '[]'), // product slugs (max 3)
    mobileMenuOpen: false,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('lx_theme', state.theme);
      document.documentElement.classList.toggle('light', state.theme === 'light');
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
    setQuickView: (state, action) => { state.quickViewProduct = action.payload; },
    toggleCompare: (state, action) => {
      const slug = action.payload;
      if (state.compareItems.includes(slug)) state.compareItems = state.compareItems.filter((s) => s !== slug);
      else if (state.compareItems.length < 3) state.compareItems.push(slug);
      localStorage.setItem('lx_compare', JSON.stringify(state.compareItems));
    },
    clearCompare: (state) => { state.compareItems = []; localStorage.setItem('lx_compare', '[]'); },
    setMobileMenu: (state, action) => { state.mobileMenuOpen = action.payload; },
  },
});

export const { toggleTheme, setQuickView, toggleCompare, clearCompare, setMobileMenu } = uiSlice.actions;
export default uiSlice.reducer;
