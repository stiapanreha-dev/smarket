import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from './index';

/**
 * MainLayout - Layout for public pages with Navbar and Footer
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
