import { useState } from 'react';
import { Container, Navbar as BootstrapNavbar, Nav, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BsCart, BsSearch } from 'react-icons/bs';
import { AiOutlineHeart } from 'react-icons/ai';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import SearchBar from '@/components/features/SearchBar';
import { NotificationBell } from '@/components/notifications';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const itemsCount = useCartStore((state) => state.itemsCount);
  const wishlistCount = useWishlistStore((state) => state.itemCount);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
            SNAILMARKETPLACE
          </BootstrapNavbar.Brand>

          {/* Desktop Search - Center */}
          <div className="navbar-search-desktop d-none d-lg-flex flex-grow-1 mx-4">
            <SearchBar placeholder={t('search.placeholder') || 'Search products, services...'} />
          </div>

          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link href="#home">{t('nav.home')}</Nav.Link>
              <Nav.Link href="#services">{t('nav.services')}</Nav.Link>
              <Nav.Link href="#about">{t('nav.about')}</Nav.Link>
              <Nav.Link href="#contact">{t('nav.contact')}</Nav.Link>

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

              {/* Wishlist Icon with Badge */}
              <div className="wishlist-icon-wrapper ms-3" onClick={() => navigate('/wishlist')}>
                <AiOutlineHeart className="wishlist-icon" />
                {wishlistCount > 0 && (
                  <span className="wishlist-badge">{wishlistCount}</span>
                )}
              </div>

              {/* Cart Icon with Badge */}
              <div className="cart-icon-wrapper ms-3" onClick={() => navigate('/cart')}>
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
          <SearchBar
            placeholder={t('search.placeholder') || 'Search products, services...'}
            onSearch={() => setShowMobileSearch(false)}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Navbar;
