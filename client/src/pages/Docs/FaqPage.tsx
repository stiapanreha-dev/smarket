import { Link } from 'react-router-dom';
import { DocsLayout } from './components/DocsLayout';

export function FaqPage() {
  return (
    <DocsLayout
      title="FAQ"
      description="Frequently asked questions about SnailMarketplace"
    >
      <h1>Frequently Asked Questions</h1>
      <p className="lead">
        Find answers to the most common questions about SnailMarketplace.
      </p>

      <h2>Account & Registration</h2>

      <h3>How do I create an account?</h3>
      <p>
        Click the "Sign Up" button in the top right corner, enter your email and
        create a password. You'll receive a verification email to activate your account.
        See our <Link to="/docs/getting-started">Getting Started guide</Link> for
        detailed instructions.
      </p>

      <h3>I didn't receive my verification email. What should I do?</h3>
      <p>
        Check your spam or junk folder first. If you still can't find it, try
        requesting a new verification email from the login page. Make sure you
        entered the correct email address during registration.
      </p>

      <h3>How do I reset my password?</h3>
      <p>
        Click "Forgot Password" on the login page and enter your email address.
        You'll receive a link to create a new password. The link expires after 1 hour.
      </p>

      <h3>Can I change my email address?</h3>
      <p>
        Yes, you can change your email address in your account settings. You'll need
        to verify the new email address before the change takes effect.
      </p>

      <h3>How do I delete my account?</h3>
      <p>
        Go to Account Settings and select "Delete Account". This action is permanent
        and will remove all your data, including order history. Active orders must
        be completed before account deletion.
      </p>

      <h2>Shopping & Orders</h2>

      <h3>How do I track my order?</h3>
      <p>
        Go to <Link to="/orders">My Orders</Link> to see all your orders and their
        current status. Once shipped, you'll see the tracking number which you can
        use on the carrier's website.
      </p>

      <h3>Can I cancel my order?</h3>
      <p>
        You can cancel an order if it hasn't been shipped yet. Go to your order
        details and click "Cancel Order". Once an order is shipped, you'll need
        to wait for delivery and then initiate a return.
      </p>

      <h3>What payment methods do you accept?</h3>
      <p>
        We accept all major credit and debit cards (Visa, Mastercard, American Express)
        through our secure Stripe payment processing. Your card information is never
        stored on our servers.
      </p>

      <h3>Is it safe to use my credit card here?</h3>
      <p>
        Yes! All payments are processed through Stripe, a PCI-compliant payment
        processor. Your card details are encrypted and never touch our servers.
        We also use HTTPS encryption for all communications.
      </p>

      <h3>Do you ship internationally?</h3>
      <p>
        Shipping availability depends on individual sellers. Check the product page
        for shipping information or contact the seller directly.
      </p>

      <h3>How long does shipping take?</h3>
      <p>
        Shipping times vary by seller location and shipping method. Estimated
        delivery times are shown at checkout. Digital products are available
        for immediate download after purchase.
      </p>

      <h3>My order arrived damaged. What should I do?</h3>
      <p>
        Contact the seller immediately through the order details page. Take photos
        of the damage and packaging. Most sellers will offer a replacement or refund
        for damaged items.
      </p>

      <h2>Returns & Refunds</h2>

      <h3>What is your return policy?</h3>
      <p>
        Return policies are set by individual sellers. Generally:
      </p>
      <ul>
        <li><strong>Physical products:</strong> 14 days from delivery</li>
        <li><strong>Digital products:</strong> 24 hours if not downloaded</li>
        <li><strong>Services:</strong> Varies by service provider</li>
      </ul>
      <p>
        Check the product page for specific return information.
      </p>

      <h3>How do I request a refund?</h3>
      <p>
        Go to your order details and click "Request Refund". Provide a reason for
        the refund request. The seller will review and respond within 3 business days.
      </p>

      <h3>How long do refunds take?</h3>
      <p>
        Once approved by the seller, refunds are processed within 5-7 business days.
        The time it takes to appear in your account depends on your bank or card issuer.
      </p>

      <h3>Can I get a refund for a digital product?</h3>
      <p>
        Digital products can only be refunded within 24 hours of purchase and only
        if you haven't downloaded the files. Once downloaded, the sale is final.
      </p>

      <h2>Selling on SnailMarketplace</h2>

      <h3>How do I become a seller?</h3>
      <p>
        Go to your account settings and click "Become a Merchant". Complete the
        application with your business information. Our team reviews applications
        within 1-2 business days. See our <Link to="/docs/sellers-guide">Seller's Guide</Link> for
        more details.
      </p>

      <h3>What are the seller fees?</h3>
      <p>
        SnailMarketplace charges a 5% platform fee on each sale. Payment processing
        fees (approximately 2.9% + $0.30) are additional and charged by Stripe.
      </p>

      <h3>When do I get paid?</h3>
      <p>
        Payouts are processed weekly through Stripe Connect. The minimum payout
        threshold is $10. You can view your payout schedule and history in the
        seller dashboard.
      </p>

      <h3>What products can I sell?</h3>
      <p>
        You can sell physical goods, digital products, and services. Prohibited
        items include illegal goods, weapons, adult content, and counterfeit items.
        See our Terms of Service for the complete list.
      </p>

      <h3>How do I handle international orders?</h3>
      <p>
        When creating a product listing, you can specify which countries you ship to.
        Set appropriate shipping rates for different regions. You're responsible for
        any customs declarations and duties.
      </p>

      <h2>Digital Products</h2>

      <h3>How do I download my purchased digital product?</h3>
      <p>
        After purchase, go to <Link to="/orders">My Orders</Link>, find your order,
        and click "Download". Digital products are available immediately after
        payment confirmation.
      </p>

      <h3>Is there a download limit?</h3>
      <p>
        You can download your purchased digital products unlimited times for personal
        use. Downloads are available indefinitely from your order history.
      </p>

      <h3>What file formats are supported?</h3>
      <p>
        Sellers can upload various file formats including PDF, ZIP, MP3, MP4, and more.
        Check the product description for specific file format information.
      </p>

      <h2>Services</h2>

      <h3>How do I book a service?</h3>
      <p>
        Browse service listings and select a time slot that works for you. Complete
        the booking by providing any required information and payment. You'll receive
        confirmation and details from the service provider.
      </p>

      <h3>Can I reschedule a service booking?</h3>
      <p>
        Rescheduling policies vary by service provider. Contact the seller through
        the order page to request a schedule change. Most providers allow rescheduling
        with 24 hours notice.
      </p>

      <h3>What if the service provider doesn't show up?</h3>
      <p>
        If a service provider fails to deliver the scheduled service, you're entitled
        to a full refund. Contact support with your order details.
      </p>

      <h2>Wishlist</h2>

      <h3>Do I need an account to use the wishlist?</h3>
      <p>
        Yes, the wishlist feature requires you to be logged in. This allows us to
        save your wishlist across devices and sessions.
      </p>

      <h3>How many items can I add to my wishlist?</h3>
      <p>
        There's no limit to the number of items you can add to your wishlist.
      </p>

      <h3>Can I share my wishlist?</h3>
      <p>
        Yes! You can share your wishlist via a unique link. Go to your wishlist
        page and click "Share" to get the link.
      </p>

      <h2>Technical Issues</h2>

      <h3>The website isn't loading properly. What should I do?</h3>
      <p>
        Try these steps:
      </p>
      <ul>
        <li>Clear your browser cache and cookies</li>
        <li>Try a different browser</li>
        <li>Disable browser extensions</li>
        <li>Check your internet connection</li>
      </ul>
      <p>
        If the issue persists, please contact support.
      </p>

      <h3>Why am I getting logged out frequently?</h3>
      <p>
        For security, sessions expire after a period of inactivity. If you're being
        logged out unexpectedly, ensure cookies are enabled in your browser and
        check that your system clock is accurate.
      </p>

      <h3>Is there a mobile app?</h3>
      <p>
        Currently, we don't have a dedicated mobile app. However, our website is
        fully responsive and works great on mobile browsers.
      </p>

      <h2>Contact Support</h2>
      <p>
        Couldn't find the answer you're looking for? Our support team is here to help.
        Contact us through:
      </p>
      <ul>
        <li>Email: support@snailmarketplace.com</li>
        <li>Response time: Within 24 hours</li>
      </ul>

      <div className="docs-alert docs-alert-info">
        <strong>Tip:</strong> When contacting support, include your order number
        (if applicable) and a detailed description of your issue for faster assistance.
      </div>
    </DocsLayout>
  );
}

export default FaqPage;
