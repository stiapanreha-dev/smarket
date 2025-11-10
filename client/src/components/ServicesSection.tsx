import { Container, Row, Col } from 'react-bootstrap';
import { BsBox, BsDownload, BsCalendarCheck } from 'react-icons/bs';
import type { Service } from '../types';

const ServicesSection = () => {
  const services: Service[] = [
    {
      id: 'physical',
      icon: '📦',
      title: 'Physical Goods',
      description: 'Sell and ship tangible products with integrated inventory management and order tracking.',
      features: [
        'Inventory Management',
        'Order Tracking',
        'Shipping Integration',
        'Multiple Currencies',
        'Multi-language Support'
      ]
    },
    {
      id: 'digital',
      icon: '💾',
      title: 'Digital Products',
      description: 'Distribute digital content like ebooks, software, courses, and media files securely.',
      features: [
        'Instant Delivery',
        'Secure Downloads',
        'License Management',
        'Access Control',
        'Version Updates'
      ]
    },
    {
      id: 'services',
      icon: '🎯',
      title: 'Professional Services',
      description: 'Book appointments and schedule professional services with integrated calendar management.',
      features: [
        'Appointment Booking',
        'Calendar Integration',
        'Automated Reminders',
        'Service Management',
        'Client Portal'
      ]
    }
  ];

  return (
    <section className="section" id="services">
      <Container>
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">
          Three powerful product types to build your marketplace empire
        </p>

        <Row className="g-4">
          {services.map((service, index) => (
            <Col lg={4} md={6} key={service.id}>
              <div
                className="service-card fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default ServicesSection;
