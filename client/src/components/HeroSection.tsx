import { Container, Row, Col, Button } from 'react-bootstrap';

const HeroSection = () => {
  return (
    <section className="hero-section" id="home">
      <Container>
        <Row className="align-items-center">
          <Col lg={8} className="mx-auto text-center">
            <h1 className="hero-title fade-in-up">
              Welcome to SnailMarketplace
            </h1>
            <p className="hero-subtitle mx-auto fade-in-up" style={{ animationDelay: '0.2s' }}>
              A modern marketplace platform for physical goods, digital products, and professional services.
              Built for speed, security, and seamless user experience.
            </p>
            <div className="d-flex gap-3 justify-content-center fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button variant="primary" size="lg" href="#services">
                Explore Services
              </Button>
              <Button variant="outline-primary" size="lg" href="#contact">
                Get Started
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;
