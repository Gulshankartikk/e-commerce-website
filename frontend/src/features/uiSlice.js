import { createSlice } from '@reduxjs/toolkit';

/* Theme persists in localStorage; default is clean light theme. */
const savedTheme = localStorage.getItem('lx_theme') || 'light';
document.documentElement.classList.toggle('light', savedTheme !== 'dark');
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: savedTheme,
    quickViewProduct: null, // product object shown in the QuickView modal
    compareItems: JSON.parse(localStorage.getItem('lx_compare') || '[]'), // product slugs (max 3)
    mobileMenuOpen: false,
    aiDrawerOpen: false,
    aiInitialQuery: '',
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
    toggleAiDrawer: (state) => { state.aiDrawerOpen = !state.aiDrawerOpen; },
    setAiDrawer: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.aiDrawerOpen = action.payload;
      } else if (typeof action.payload === 'object') {
        state.aiDrawerOpen = action.payload.open ?? true;
        if (action.payload.query !== undefined) {
          state.aiInitialQuery = action.payload.query;
        }
      }
    },
    clearAiInitialQuery: (state) => { state.aiInitialQuery = ''; },
  },
});

export const {
  toggleTheme,
  setQuickView,
  toggleCompare,
  clearCompare,
  setMobileMenu,
  toggleAiDrawer,
  setAiDrawer,
  clearAiInitialQuery,
} = uiSlice.actions;
export default uiSlice.reducer;
