import { useState, useEffect } from 'react';
import { Container, Navbar as BootstrapNavbar, Nav, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BsCart, BsSearch } from 'react-icons/bs';
import { AiOutlineHeart } from 'react-icons/ai';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore, useViewMode, useSetViewMode } from '@/store/authStore';
import type { ViewMode } from '@/store/authStore';
import SearchBar from '@/components/features/SearchBar';
import { NotificationBell } from '@/components/notifications';
import { prefetchRoute } from '@/utils/prefetch';

// Prefetch functions for critical routes
const prefetchCatalog = () =>
  prefetchRoute(() => import('@/pages/Catalog'), 'catalog');

const prefetchCart = () =>
  prefetchRoute(() => import('@/pages/Cart'), 'cart');

const prefetchWishlist = () =>
  prefetchRoute(() => import('@/pages/Wishlist'), 'wishlist');

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const itemsCount = useCartStore((state) => state.itemsCount);
  const wishlistCount = useWishlistStore((state) => state.itemCount);
  const { isAuthenticated, user, logout } = useAuthStore();
  const viewMode = useViewMode();
  const setViewMode = useSetViewMode();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Check if user can switch modes (merchants and admins only)
  const canSwitchMode = isAuthenticated && (user?.role === 'merchant' || user?.role === 'admin');

  // Handle mode change
  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'buyer') {
      navigate('/dashboard');
    } else {
      navigate('/merchant/dashboard');
    }
  };

  // Determine profile link based on authentication status and view mode
  const getProfileLink = () => {
    if (!isAuthenticated) {
      return '/login';
    }

    // Admins always go to admin dashboard
    if (user?.role === 'admin') {
      return '/admin';
    }

    // For merchants - link based on current view mode
    if (user?.role === 'merchant') {
      return viewMode === 'seller' ? '/merchant/dashboard' : '/dashboard';
    }

    // Regular authenticated users go to customer dashboard
    return '/dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    // Set document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <>
      <BootstrapNavbar expand="lg" className="navbar" fixed="top">
        <Container>
          <BootstrapNavbar.Brand href="/">
            <img
              src="/snail-logo.png"
              alt="SnailMarketplace"
              height="40"
            />
          </BootstrapNavbar.Brand>

          {/* Desktop Search - Center */}
          <div className="navbar-search-desktop d-none d-lg-flex flex-grow-1 mx-4">
            <SearchBar />
          </div>

          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {user?.role === 'admin' && (
                <Nav.Link href="/admin">{t('nav.admin') || 'Admin'}</Nav.Link>
              )}

              {/* Mode Switcher - Only for merchants and admins */}
              {canSwitchMode && (
                <div className="mode-switcher ms-3">
                  <button
                    className={viewMode === 'buyer' ? 'active' : ''}
                    onClick={() => handleModeChange('buyer')}
                  >
                    {t('nav.buyerMode') || 'Покупатель'}
                  </button>
                  <button
                    className={viewMode === 'seller' ? 'active' : ''}
                    onClick={() => handleModeChange('seller')}
                  >
                    {t('nav.sellerMode') || 'Продавец'}
                  </button>
                </div>
              )}

              {/* Mobile Search Icon */}
              <div
                className="search-icon-wrapper d-lg-none ms-3"
                onClick={() => setShowMobileSearch(true)}
              >
                <BsSearch className="search-icon-mobile" />
              </div>

              {/* Notification Bell */}
              <div className="ms-3">
                <NotificationBell />
              </div>

              {/* Wishlist Icon with Badge - Prefetch on hover */}
              <div
                className="wishlist-icon-wrapper ms-3"
                onClick={() => navigate('/wishlist')}
                onMouseEnter={prefetchWishlist}
                onFocus={prefetchWishlist}
              >
                <AiOutlineHeart className="wishlist-icon" />
                {wishlistCount > 0 && (
                  <span className="wishlist-badge">{wishlistCount}</span>
                )}
              </div>

              {/* Cart Icon with Badge - Prefetch on hover */}
              <div
                className="cart-icon-wrapper ms-3"
                onClick={() => navigate('/cart')}
                onMouseEnter={prefetchCart}
                onFocus={prefetchCart}
              >
                <BsCart className="cart-icon" />
                {itemsCount > 0 && (
                  <span className="cart-badge">{itemsCount}</span>
                )}
              </div>

              <div className="language-switcher ms-3">
                <button
                  className={i18n.language === 'en' ? 'active' : ''}
                  onClick={() => handleLanguageChange('en')}
                >
                  EN
                </button>
                <button
                  className={i18n.language === 'ru' ? 'active' : ''}
                  onClick={() => handleLanguageChange('ru')}
                >
                  RU
                </button>
                <button
                  className={i18n.language === 'ar' ? 'active' : ''}
                  onClick={() => handleLanguageChange('ar')}
                >
                  AR
                </button>
              </div>

              {/* Logout Icon */}
              {isAuthenticated && (
                <div
                  className="logout-icon-wrapper ms-3"
                  onClick={handleLogout}
                  title={t('nav.logout') || 'Logout'}
                >
                  <FaSignOutAlt className="logout-icon" />
                </div>
              )}

              {/* Profile Avatar */}
              <div
                className="profile-avatar-wrapper ms-3"
                onClick={() => navigate(getProfileLink())}
                title={isAuthenticated ? (user?.first_name || t('nav.profile')) : t('nav.login')}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.first_name || 'Profile'}
                    className="profile-avatar"
                  />
                ) : (
                  <FaUserCircle className="profile-avatar-placeholder" />
                )}
              </div>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* Mobile Search Modal */}
      <Modal
        show={showMobileSearch}
        onHide={() => setShowMobileSearch(false)}
        className="mobile-search-modal"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Search</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SearchBar onSearch={() => setShowMobileSearch(false)} />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Navbar;
