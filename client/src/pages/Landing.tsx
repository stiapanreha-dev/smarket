import { Navbar, Footer } from '../components/layout';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import ComponentShowcase from '../components/ComponentShowcase';

const Landing = () => {
  return (
    <div className="landing-page">
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
