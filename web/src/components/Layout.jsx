import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import CartDrawer from './CartDrawer';
import WhatsAppFloat from './WhatsAppFloat';
import Toasts from './Toasts';

export default function Layout() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');

  if (isAdminArea) {
    return (
      <>
        <Outlet />
        <Toasts />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <CartDrawer />
      <WhatsAppFloat />
      <Toasts />
    </>
  );
}