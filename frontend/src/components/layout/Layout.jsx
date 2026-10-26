import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import AIChatDrawer from '../ai/AIChatDrawer.jsx';

/** Storefront shell: sticky navbar, routed page, footer, AI assistant. */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AIChatDrawer />
    </div>
  );
}
