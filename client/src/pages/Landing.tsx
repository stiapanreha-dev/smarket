import { Navbar, Footer } from '../components/layout';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import ComponentShowcase from '../components/ComponentShowcase';
import { SEO } from '../components/SEO';
import { StructuredData } from '../components/StructuredData';

const Landing = () => {
  // Get base URL for structured data
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://snailmarketplace.com';

  return (
    <div className="landing-page">
      {/* SEO Meta Tags */}
      <SEO
        title="Buy & Sell Physical, Digital, Service Products"
        description="SnailMarketplace - Your one-stop marketplace for physical goods, digital products, and professional services. Shop with confidence, sell with ease. Multi-language support and secure payments."
        keywords="marketplace, buy online, sell online, physical products, digital products, services, e-commerce, online shopping"
        type="website"
        url={baseUrl}
      />

      {/* Organization Structured Data */}
      <StructuredData
        type="organization"
        organization={{
          name: 'SnailMarketplace',
          url: baseUrl,
          logo: `${baseUrl}/logo.png`,
          description: 'A modular marketplace platform for physical goods, digital products, and services',
          sameAs: [
            // Add social media profiles here when available
            // 'https://facebook.com/snailmarketplace',
            // 'https://twitter.com/snailmarketplace',
            // 'https://linkedin.com/company/snailmarketplace',
          ],
        }}
      />

      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <ComponentShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
