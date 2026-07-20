import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { store } from './app/store.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
            success: { iconTheme: { primary: '#06B6D4', secondary: '#0F172A' } },
            error: { iconTheme: { primary: '#F97316', secondary: '#0F172A' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
