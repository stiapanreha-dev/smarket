import { DocsLayout } from './components/DocsLayout';

export function ApiDocsPage() {
  return (
    <DocsLayout
      title="API Reference"
      description="Technical documentation for SnailMarketplace API"
    >
      <h1>API Reference</h1>
      <p className="lead">
        Technical documentation for developers integrating with SnailMarketplace.
        Our RESTful API provides programmatic access to marketplace functionality.
      </p>

      <h2>Overview</h2>
      <p>
        The SnailMarketplace API is organized around REST principles. Our API has
        predictable resource-oriented URLs, accepts JSON-encoded request bodies,
        returns JSON-encoded responses, and uses standard HTTP response codes,
        authentication, and verbs.
      </p>

      <h3>Base URL</h3>
      <pre>
        <code>https://market.devloc.su/api/v1</code>
      </pre>

      <h3>Interactive Documentation</h3>
      <p>
        For detailed endpoint documentation with interactive testing capabilities,
        visit our Swagger UI:
      </p>
      <p>
        <a
          href="/api/v1/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Open Swagger Documentation
        </a>
      </p>

      <h2>Authentication</h2>
      <p>
        The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require
        an authenticated user.
      </p>

      <h3>Obtaining Tokens</h3>
      <p>To authenticate, send a POST request to the login endpoint:</p>
      <pre>
        <code>{`POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}`}</code>
      </pre>

      <h3>Using Tokens</h3>
      <p>Include the access token in the Authorization header:</p>
      <pre>
        <code>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}</code>
      </pre>

      <h3>Token Refresh</h3>
      <p>
        Access tokens expire after 15 minutes. Use the refresh token to obtain
        a new access token:
      </p>
      <pre>
        <code>{`POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}`}</code>
      </pre>

      <div className="docs-alert docs-alert-warning">
        <strong>Security:</strong> Never expose your tokens in client-side code or
        version control. Store them securely and transmit only over HTTPS.
      </div>

      <h2>API Endpoints</h2>
      <p>Here's an overview of the main API endpoint groups:</p>

      <h3>Authentication</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>POST</code></td>
            <td><code>/auth/register</code></td>
            <td>Create a new user account</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/auth/login</code></td>
            <td>Authenticate and receive tokens</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/auth/refresh</code></td>
            <td>Refresh access token</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/auth/logout</code></td>
            <td>Invalidate refresh token</td>
          </tr>
        </tbody>
      </table>

      <h3>Products</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td><code>/products</code></td>
            <td>List all products (with pagination)</td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>/products/:id</code></td>
            <td>Get product details</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/products</code></td>
            <td>Create a new product (merchant)</td>
          </tr>
          <tr>
            <td><code>PATCH</code></td>
            <td><code>/products/:id</code></td>
            <td>Update a product (merchant)</td>
          </tr>
          <tr>
            <td><code>DELETE</code></td>
            <td><code>/products/:id</code></td>
            <td>Delete a product (merchant)</td>
          </tr>
        </tbody>
      </table>

      <h3>Categories</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td><code>/categories</code></td>
            <td>List all categories</td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>/categories/:id</code></td>
            <td>Get category details</td>
          </tr>
        </tbody>
      </table>

      <h3>Cart</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td><code>/cart</code></td>
            <td>Get current cart contents</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/cart/items</code></td>
            <td>Add item to cart</td>
          </tr>
          <tr>
            <td><code>PATCH</code></td>
            <td><code>/cart/items/:id</code></td>
            <td>Update item quantity</td>
          </tr>
          <tr>
            <td><code>DELETE</code></td>
            <td><code>/cart/items/:id</code></td>
            <td>Remove item from cart</td>
          </tr>
        </tbody>
      </table>

      <h3>Orders</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td><code>/orders</code></td>
            <td>List user's orders</td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>/orders/:id</code></td>
            <td>Get order details</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/orders</code></td>
            <td>Create order from cart</td>
          </tr>
        </tbody>
      </table>

      <h3>Wishlist</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td><code>/wishlist</code></td>
            <td>Get user's wishlist</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/wishlist/:productId</code></td>
            <td>Add product to wishlist</td>
          </tr>
          <tr>
            <td><code>DELETE</code></td>
            <td><code>/wishlist/:productId</code></td>
            <td>Remove from wishlist</td>
          </tr>
        </tbody>
      </table>

      <h2>Response Format</h2>
      <p>All responses follow a consistent format:</p>

      <h3>Success Response</h3>
      <pre>
        <code>{`{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}`}</code>
      </pre>

      <h3>Error Response</h3>
      <pre>
        <code>{`{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}`}</code>
      </pre>

      <h2>Rate Limiting</h2>
      <p>
        To ensure fair usage and protect our infrastructure, API requests are
        rate limited:
      </p>
      <ul>
        <li><strong>Anonymous requests:</strong> 60 requests per minute</li>
        <li><strong>Authenticated requests:</strong> 120 requests per minute</li>
        <li><strong>Merchant requests:</strong> 300 requests per minute</li>
      </ul>
      <p>
        Rate limit information is included in response headers:
      </p>
      <pre>
        <code>{`X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1640995200`}</code>
      </pre>

      <div className="docs-alert docs-alert-info">
        <strong>Note:</strong> If you need higher rate limits for your integration,
        please contact us to discuss enterprise options.
      </div>

      <h2>HTTP Status Codes</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>200</code></td>
            <td>Success</td>
          </tr>
          <tr>
            <td><code>201</code></td>
            <td>Created - resource successfully created</td>
          </tr>
          <tr>
            <td><code>400</code></td>
            <td>Bad Request - invalid parameters</td>
          </tr>
          <tr>
            <td><code>401</code></td>
            <td>Unauthorized - authentication required</td>
          </tr>
          <tr>
            <td><code>403</code></td>
            <td>Forbidden - insufficient permissions</td>
          </tr>
          <tr>
            <td><code>404</code></td>
            <td>Not Found - resource doesn't exist</td>
          </tr>
          <tr>
            <td><code>429</code></td>
            <td>Too Many Requests - rate limit exceeded</td>
          </tr>
          <tr>
            <td><code>500</code></td>
            <td>Internal Server Error</td>
          </tr>
        </tbody>
      </table>

      <h2>SDKs and Libraries</h2>
      <p>
        Currently, we don't provide official SDKs. However, our REST API is
        straightforward to integrate with any HTTP client in your preferred
        programming language.
      </p>

      <h2>Need Help?</h2>
      <p>
        For API support or questions, please open an issue on our GitHub repository
        or contact our developer support team.
      </p>
    </DocsLayout>
  );
}

export default ApiDocsPage;
