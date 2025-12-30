import { Link } from 'react-router-dom';
import { DocsLayout } from './components/DocsLayout';

export function BuyersGuidePage() {
  return (
    <DocsLayout
      title="Buyer's Guide"
      description="Complete guide for buyers on SnailMarketplace"
    >
      <h1>Buyer's Guide</h1>
      <p className="lead">
        Everything you need to know about browsing products, making purchases,
        and managing your orders on SnailMarketplace.
      </p>

      <h2>Browsing Products</h2>
      <p>
        SnailMarketplace offers three types of products:
      </p>
      <ul>
        <li><strong>Physical Products:</strong> Tangible goods that will be shipped to your address</li>
        <li><strong>Digital Products:</strong> Downloadable content like ebooks, software, or media files</li>
        <li><strong>Services:</strong> Professional services that can be booked for specific times</li>
      </ul>

      <h3>Search and Filters</h3>
      <p>Find exactly what you're looking for using our powerful search and filter options:</p>
      <ul>
        <li><strong>Search Bar:</strong> Search by product name, description, or keywords</li>
        <li><strong>Categories:</strong> Browse products organized by category</li>
        <li><strong>Product Type:</strong> Filter by physical, digital, or service products</li>
        <li><strong>Price Range:</strong> Set minimum and maximum price limits</li>
        <li><strong>Sort Options:</strong> Sort by newest, price (low to high), price (high to low), or rating</li>
      </ul>

      <h2>Shopping Cart</h2>
      <p>
        Your shopping cart allows you to collect items before purchasing:
      </p>
      <ul>
        <li>Add items from product pages or directly from the catalog</li>
        <li>Adjust quantities or remove items at any time</li>
        <li>See the subtotal and estimated shipping costs</li>
        <li>Cart contents are saved automatically, even if you leave the site</li>
      </ul>

      <div className="docs-alert docs-alert-info">
        <strong>Note:</strong> Guest users can also use the cart. Your items will be preserved
        using browser storage and can be merged with your account cart when you log in.
      </div>

      <h2>Wishlist</h2>
      <p>
        Save products you're interested in for later:
      </p>
      <ul>
        <li>Click the heart icon on any product to add it to your wishlist</li>
        <li>Access your wishlist from the navigation menu</li>
        <li>Move items from wishlist to cart when you're ready to buy</li>
        <li>Share your wishlist with friends and family</li>
      </ul>

      <div className="docs-alert docs-alert-warning">
        <strong>Important:</strong> You must be logged in to use the wishlist feature.
      </div>

      <h2>Checkout Process</h2>
      <ol className="docs-steps">
        <li>
          <strong>Review Cart</strong>
          <p>Verify the items, quantities, and prices in your cart before proceeding.</p>
        </li>
        <li>
          <strong>Shipping Information</strong>
          <p>
            Select a saved address or enter a new shipping address. For digital products,
            this step may be skipped.
          </p>
        </li>
        <li>
          <strong>Payment Method</strong>
          <p>
            Choose your preferred payment method. We support major credit cards through
            our secure Stripe integration.
          </p>
        </li>
        <li>
          <strong>Order Review</strong>
          <p>Review all order details including items, shipping, and total cost.</p>
        </li>
        <li>
          <strong>Confirm Payment</strong>
          <p>Complete the secure payment process to finalize your order.</p>
        </li>
      </ol>

      <h2>Order Tracking</h2>
      <p>Track your orders easily from your account:</p>
      <ul>
        <li>View all orders in <Link to="/orders">My Orders</Link></li>
        <li>See detailed status for each item (pending, processing, shipped, delivered)</li>
        <li>Track shipping with carrier tracking numbers</li>
        <li>Download digital products directly from the order page</li>
        <li>Receive email notifications for status updates</li>
      </ul>

      <h3>Order Statuses</h3>
      <p>Here's what each status means:</p>
      <ul>
        <li><strong>Pending:</strong> Order received, awaiting payment confirmation</li>
        <li><strong>Payment Confirmed:</strong> Payment successful, preparing your order</li>
        <li><strong>Preparing:</strong> Seller is preparing your items for shipment</li>
        <li><strong>Shipped:</strong> Your order is on the way (tracking info available)</li>
        <li><strong>Delivered:</strong> Order has been delivered</li>
        <li><strong>Cancelled:</strong> Order was cancelled</li>
      </ul>

      <h2>Payment Methods</h2>
      <p>We accept the following payment methods:</p>
      <ul>
        <li>Visa, Mastercard, American Express</li>
        <li>All payments are processed securely through Stripe</li>
        <li>Your card information is never stored on our servers</li>
      </ul>

      <h2>Returns and Refunds</h2>
      <p>
        Return policies may vary by seller. Please check the product page for specific
        return information. Generally:
      </p>
      <ul>
        <li>Physical products: Contact the seller within 14 days of delivery</li>
        <li>Digital products: Refunds available within 24 hours if not downloaded</li>
        <li>Services: Cancellation policies vary by service provider</li>
      </ul>

      <h2>Need Help?</h2>
      <p>
        If you have questions or issues with your order, check our <Link to="/docs/faq">FAQ</Link> or
        contact our support team.
      </p>
    </DocsLayout>
  );
}

export default BuyersGuidePage;
