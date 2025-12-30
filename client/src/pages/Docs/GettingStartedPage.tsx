import { Link } from 'react-router-dom';
import { DocsLayout } from './components/DocsLayout';

export function GettingStartedPage() {
  return (
    <DocsLayout
      title="Getting Started"
      description="Learn how to get started with SnailMarketplace"
    >
      <h1>Getting Started</h1>
      <p className="lead">
        Welcome to SnailMarketplace! This guide will help you create an account,
        set up your profile, and make your first purchase in just a few minutes.
      </p>

      <h2>Creating Your Account</h2>
      <ol className="docs-steps">
        <li>
          <strong>Go to the Registration Page</strong>
          <p>
            Click the "Sign Up" button in the top right corner of the page, or go directly
            to <Link to="/register">/register</Link>.
          </p>
        </li>
        <li>
          <strong>Enter Your Information</strong>
          <p>
            Fill in your email address and create a secure password. Your password should
            be at least 8 characters long and include a mix of letters and numbers.
          </p>
        </li>
        <li>
          <strong>Verify Your Email</strong>
          <p>
            Check your inbox for a verification email and click the confirmation link
            to activate your account.
          </p>
        </li>
        <li>
          <strong>Complete Your Profile</strong>
          <p>
            Add your name, shipping address, and other details to make checkout faster.
          </p>
        </li>
      </ol>

      <h2>Setting Up Your Profile</h2>
      <p>
        After creating your account, we recommend completing your profile for a better experience:
      </p>
      <ul>
        <li><strong>Personal Information:</strong> Add your full name and contact details</li>
        <li><strong>Shipping Address:</strong> Save your default shipping address for faster checkout</li>
        <li><strong>Language & Currency:</strong> Set your preferred language (English, Russian, Arabic) and currency</li>
        <li><strong>Notifications:</strong> Choose how you want to receive order updates</li>
      </ul>

      <div className="docs-alert docs-alert-info">
        <strong>Tip:</strong> You can add multiple shipping addresses and select the appropriate one during checkout.
      </div>

      <h2>Making Your First Purchase</h2>
      <ol className="docs-steps">
        <li>
          <strong>Browse Products</strong>
          <p>
            Use the catalog to explore products. Filter by category, price range, or product type
            (physical goods, digital products, or services).
          </p>
        </li>
        <li>
          <strong>Add to Cart</strong>
          <p>
            Click "Add to Cart" on any product you want to purchase. You can continue shopping
            or proceed to checkout.
          </p>
        </li>
        <li>
          <strong>Review Your Cart</strong>
          <p>
            Click the cart icon to review your items. You can adjust quantities or remove items
            before proceeding.
          </p>
        </li>
        <li>
          <strong>Checkout</strong>
          <p>
            Select your shipping address, choose a payment method, and complete your purchase.
            You'll receive an order confirmation email with tracking information.
          </p>
        </li>
      </ol>

      <h2>Guest Checkout</h2>
      <p>
        Don't want to create an account? No problem! You can shop as a guest:
      </p>
      <ul>
        <li>Browse and add items to your cart without logging in</li>
        <li>Provide your email during checkout for order updates</li>
        <li>Your cart is saved automatically and persists across sessions</li>
        <li>Create an account later to access order history and saved addresses</li>
      </ul>

      <h2>Next Steps</h2>
      <p>Now that you're set up, explore more features:</p>
      <ul>
        <li><Link to="/docs/buyers-guide">Buyer's Guide</Link> - Learn about all shopping features</li>
        <li><Link to="/docs/sellers-guide">Seller's Guide</Link> - Start selling on SnailMarketplace</li>
        <li><Link to="/docs/faq">FAQ</Link> - Get answers to common questions</li>
      </ul>
    </DocsLayout>
  );
}

export default GettingStartedPage;
