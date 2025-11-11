import { Container, Navbar as BootstrapNavbar, Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BsCart } from 'react-icons/bs';
import { useCartStore } from '@/store/cartStore';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const itemsCount = useCartStore((state) => state.itemsCount);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    // Set document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <BootstrapNavbar expand="lg" className="navbar" fixed="top">
      <Container>
        <BootstrapNavbar.Brand href="/">
          SNAILMARKETPLACE
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link href="#home">{t('nav.home')}</Nav.Link>
            <Nav.Link href="#services">{t('nav.services')}</Nav.Link>
            <Nav.Link href="#about">{t('nav.about')}</Nav.Link>
            <Nav.Link href="#contact">{t('nav.contact')}</Nav.Link>

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
  );
};

export default Navbar;
