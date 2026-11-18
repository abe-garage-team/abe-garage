import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import AdminMenu from '../components/layout/AdminMenu.jsx';

// Staff pages: the site header and footer, with the admin menu on the left.
export default function StaffLayout() {
  return (
    <>
      <Header />
      <div className="staff-layout">
        <AdminMenu />
        <main className="staff-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
