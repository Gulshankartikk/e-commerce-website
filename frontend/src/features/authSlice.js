import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios.js';

/* ---------- Thunks ---------- */
export const loginUser = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('lx_token', data.token);
    return data.user;
  } catch (e) { return rejectWithValue(e.message); }
});

export const registerUser = createAsyncThunk('auth/register', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', body);
    localStorage.setItem('lx_token', data.token);
    return data.user;
  } catch (e) { return rejectWithValue(e.message); }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (e) { return rejectWithValue(e.message); }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout').catch(() => {});
  localStorage.removeItem('lx_token');
});

const pendingReducer = (state) => { state.loading = true; state.error = null; };
const rejectedReducer = (state, action) => { state.loading = false; state.error = action.payload; };
const fulfilledUser = (state, action) => { state.loading = false; state.user = action.payload; state.initialized = true; };

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: {
    setUser: (state, action) => { state.user = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(loginUser.pending, pendingReducer).addCase(loginUser.fulfilled, fulfilledUser).addCase(loginUser.rejected, rejectedReducer)
      .addCase(registerUser.pending, pendingReducer).addCase(registerUser.fulfilled, fulfilledUser).addCase(registerUser.rejected, rejectedReducer)
      .addCase(fetchMe.pending, pendingReducer).addCase(fetchMe.fulfilled, fulfilledUser)
      .addCase(fetchMe.rejected, (state) => { state.loading = false; state.user = null; state.initialized = true; })
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
