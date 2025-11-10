import { Navbar, Footer } from '../components/layout';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';

const Landing = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
