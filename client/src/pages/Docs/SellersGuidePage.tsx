import { Link } from 'react-router-dom';
import { DocsLayout } from './components/DocsLayout';

export function SellersGuidePage() {
  return (
    <DocsLayout
      title="Seller's Guide"
      description="Complete guide for merchants on SnailMarketplace"
    >
      <h1>Seller's Guide</h1>
      <p className="lead">
        Learn how to become a merchant, list products, manage orders, and grow your
        business on SnailMarketplace.
      </p>

      <h2>Becoming a Merchant</h2>
      <p>
        To sell on SnailMarketplace, you need to upgrade your account to a merchant account:
      </p>
      <ol className="docs-steps">
        <li>
          <strong>Create an Account</strong>
          <p>
            If you don't have an account yet, <Link to="/register">sign up</Link> first.
            You'll need a verified email address to become a merchant.
          </p>
        </li>
        <li>
          <strong>Request Merchant Status</strong>
          <p>
            Go to your account settings and click "Become a Merchant". Fill in your
            business information including business name, description, and contact details.
          </p>
        </li>
        <li>
          <strong>Verification</strong>
          <p>
            Our team will review your application. This usually takes 1-2 business days.
            You'll receive an email notification once approved.
          </p>
        </li>
        <li>
          <strong>Set Up Payment</strong>
          <p>
            Connect your Stripe account to receive payouts. You'll need to provide
            banking information and verify your identity.
          </p>
        </li>
      </ol>

      <div className="docs-alert docs-alert-info">
        <strong>Note:</strong> Merchant accounts have access to the seller dashboard,
        where you can manage products, orders, and view analytics.
      </div>

      <h2>Adding Products</h2>
      <p>
        Once approved as a merchant, you can start listing products:
      </p>

      <h3>Product Types</h3>
      <p>SnailMarketplace supports three types of products:</p>
      <ul>
        <li>
          <strong>Physical Products:</strong> Tangible goods that require shipping.
          You'll need to specify weight, dimensions, and shipping options.
        </li>
        <li>
          <strong>Digital Products:</strong> Downloadable content like ebooks, software,
          music, or graphics. Upload files up to 500MB per product.
        </li>
        <li>
          <strong>Services:</strong> Professional services with booking capabilities.
          Set your availability, duration, and pricing.
        </li>
      </ul>

      <h3>Creating a Listing</h3>
      <ol className="docs-steps">
        <li>
          <strong>Go to Seller Dashboard</strong>
          <p>Access the dashboard from the navigation menu or go to <Link to="/seller">/seller</Link>.</p>
        </li>
        <li>
          <strong>Click "Add Product"</strong>
          <p>Choose the product type and fill in the required information.</p>
        </li>
        <li>
          <strong>Add Product Details</strong>
          <p>
            Include a compelling title, detailed description, and accurate pricing.
            Use keywords that buyers might search for.
          </p>
        </li>
        <li>
          <strong>Upload Images</strong>
          <p>
            Add high-quality images (up to 10 per product). The first image will be
            the main product thumbnail.
          </p>
        </li>
        <li>
          <strong>Set Inventory</strong>
          <p>
            Specify the available quantity and whether to track inventory.
            Set low stock alerts to avoid overselling.
          </p>
        </li>
        <li>
          <strong>Publish</strong>
          <p>
            Review your listing and click "Publish" to make it live. You can also
            save as draft to publish later.
          </p>
        </li>
      </ol>

      <h3>Product Translations</h3>
      <p>
        SnailMarketplace supports multiple languages. To reach more customers,
        consider adding translations for:
      </p>
      <ul>
        <li>Product name</li>
        <li>Description</li>
        <li>Short description</li>
      </ul>
      <p>
        Translations can be added from the product edit page under the "Translations" tab.
      </p>

      <h2>Managing Inventory</h2>
      <p>Keep your inventory accurate to maintain customer satisfaction:</p>
      <ul>
        <li><strong>Stock Tracking:</strong> Enable automatic stock reduction when orders are placed</li>
        <li><strong>Low Stock Alerts:</strong> Set thresholds to receive notifications</li>
        <li><strong>Bulk Updates:</strong> Update multiple products at once from the inventory page</li>
        <li><strong>Out of Stock:</strong> Products automatically hide when stock reaches zero</li>
      </ul>

      <h2>Order Fulfillment</h2>
      <p>When you receive an order, follow these steps:</p>

      <h3>Physical Products</h3>
      <ol className="docs-steps">
        <li>
          <strong>Review Order</strong>
          <p>Check order details, shipping address, and any special instructions.</p>
        </li>
        <li>
          <strong>Prepare Shipment</strong>
          <p>Pack the items securely and print the shipping label.</p>
        </li>
        <li>
          <strong>Mark as Shipped</strong>
          <p>
            Update the order status and add the tracking number. The buyer will
            receive an automatic notification.
          </p>
        </li>
        <li>
          <strong>Complete</strong>
          <p>Once delivered, the order will be marked as complete.</p>
        </li>
      </ol>

      <h3>Digital Products</h3>
      <p>
        Digital product delivery is automatic. When a buyer completes payment,
        they immediately receive access to download the files from their order page.
      </p>

      <h3>Services</h3>
      <ol className="docs-steps">
        <li>
          <strong>Confirm Booking</strong>
          <p>Review the booking request and confirm the appointment.</p>
        </li>
        <li>
          <strong>Provide Service</strong>
          <p>Deliver the service at the scheduled time.</p>
        </li>
        <li>
          <strong>Mark Complete</strong>
          <p>Update the status once the service has been provided.</p>
        </li>
      </ol>

      <div className="docs-alert docs-alert-warning">
        <strong>Important:</strong> Orders should be processed within 3 business days.
        Delayed fulfillment may affect your seller rating.
      </div>

      <h2>Seller Dashboard</h2>
      <p>Your dashboard provides a comprehensive view of your business:</p>
      <ul>
        <li><strong>Overview:</strong> Quick summary of sales, orders, and revenue</li>
        <li><strong>Orders:</strong> Manage incoming orders and track fulfillment status</li>
        <li><strong>Products:</strong> Add, edit, and manage your product listings</li>
        <li><strong>Analytics:</strong> View sales trends, popular products, and customer insights</li>
        <li><strong>Reviews:</strong> Read and respond to customer reviews</li>
        <li><strong>Settings:</strong> Update your store information and preferences</li>
      </ul>

      <h2>Analytics</h2>
      <p>Track your store's performance with detailed analytics:</p>
      <ul>
        <li><strong>Sales Reports:</strong> Daily, weekly, and monthly sales data</li>
        <li><strong>Revenue Tracking:</strong> Monitor earnings and identify trends</li>
        <li><strong>Top Products:</strong> See which items are selling best</li>
        <li><strong>Customer Insights:</strong> Understand your buyer demographics</li>
        <li><strong>Traffic Sources:</strong> Learn how customers find your products</li>
      </ul>

      <h2>Payouts</h2>
      <p>Receive your earnings through our secure payout system:</p>
      <ul>
        <li>Payouts are processed automatically through Stripe Connect</li>
        <li>Standard payout schedule is weekly (can be configured)</li>
        <li>Minimum payout threshold: $10</li>
        <li>Platform fee: 5% per transaction</li>
        <li>View payout history and upcoming payments in your dashboard</li>
      </ul>

      <div className="docs-alert docs-alert-success">
        <strong>Tip:</strong> Keep your Stripe account in good standing to ensure
        uninterrupted payouts. Verify all required information promptly.
      </div>

      <h2>Best Practices</h2>
      <p>Tips for successful selling:</p>
      <ul>
        <li><strong>Quality Images:</strong> Use clear, high-resolution photos from multiple angles</li>
        <li><strong>Detailed Descriptions:</strong> Provide accurate, comprehensive product information</li>
        <li><strong>Competitive Pricing:</strong> Research similar products and price accordingly</li>
        <li><strong>Fast Response:</strong> Reply to customer inquiries within 24 hours</li>
        <li><strong>Quick Fulfillment:</strong> Ship orders promptly to maintain good reviews</li>
        <li><strong>Professional Communication:</strong> Be courteous and helpful with all customers</li>
      </ul>

      <h2>Need Help?</h2>
      <p>
        If you have questions about selling, check our <Link to="/docs/faq">FAQ</Link> or
        contact seller support for assistance.
      </p>
    </DocsLayout>
  );
}

export default SellersGuidePage;
