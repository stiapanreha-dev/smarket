import { Helmet } from 'react-helmet-async';

// Type definitions for Schema.org structured data
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ProductData {
  name: string;
  description: string;
  image?: string;
  sku?: string;
  brand?: string;
  price: string;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  url: string;
}

interface OrganizationData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[]; // Social media profiles
}

interface StructuredDataProps {
  /**
   * Type of structured data to render
   */
  type: 'product' | 'breadcrumb' | 'organization';

  /**
   * Product data (when type is 'product')
   */
  product?: ProductData;

  /**
   * Breadcrumb items (when type is 'breadcrumb')
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Organization data (when type is 'organization')
   */
  organization?: OrganizationData;
}

/**
 * StructuredData Component for JSON-LD structured data
 *
 * Provides structured data for search engines to better understand page content
 * and enable rich snippets in search results.
 *
 * Supports:
 * - Product schema (for product pages)
 * - BreadcrumbList schema (for navigation)
 * - Organization schema (for company info)
 *
 * @example Product Schema
 * ```tsx
 * <StructuredData
 *   type="product"
 *   product={{
 *     name: "iPhone 14 Pro",
 *     description: "Latest iPhone with...",
 *     price: "999.00",
 *     currency: "USD",
 *     availability: "InStock",
 *     rating: 4.5,
 *     reviewCount: 120,
 *     url: "https://snailmarket.com/products/123"
 *   }}
 * />
 * ```
 *
 * @example Breadcrumb Schema
 * ```tsx
 * <StructuredData
 *   type="breadcrumb"
 *   breadcrumbs={[
 *     { name: "Home", url: "/" },
 *     { name: "Catalog", url: "/catalog" },
 *     { name: "iPhone", url: "/catalog/123" }
 *   ]}
 * />
 * ```
 */
export function StructuredData({
  type,
  product,
  breadcrumbs,
  organization,
}: StructuredDataProps) {
  // Generate Product schema
  const generateProductSchema = (data: ProductData) => {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      description: data.description,
      url: data.url,
      offers: {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: data.currency,
        availability: `https://schema.org/${data.availability}`,
        url: data.url,
      },
    };

    // Add optional fields
    if (data.image) {
      schema.image = data.image;
    }

    if (data.sku) {
      schema.sku = data.sku;
    }

    if (data.brand) {
      schema.brand = {
        '@type': 'Brand',
        name: data.brand,
      };
    }

    // Add aggregate rating if available
    if (data.rating && data.reviewCount) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.rating.toString(),
        reviewCount: data.reviewCount.toString(),
        bestRating: '5',
        worstRating: '1',
      };
    }

    return schema;
  };

  // Generate BreadcrumbList schema
  const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  };

  // Generate Organization schema
  const generateOrganizationSchema = (data: OrganizationData) => {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name,
      url: data.url,
    };

    if (data.logo) {
      schema.logo = data.logo;
    }

    if (data.description) {
      schema.description = data.description;
    }

    if (data.contactPoint) {
      schema.contactPoint = {
        '@type': 'ContactPoint',
        ...data.contactPoint,
      };
    }

    if (data.sameAs && data.sameAs.length > 0) {
      schema.sameAs = data.sameAs;
    }

    return schema;
  };

  // Generate appropriate schema based on type
  let schema: any = null;

  switch (type) {
    case 'product':
      if (product) {
        schema = generateProductSchema(product);
      }
      break;

    case 'breadcrumb':
      if (breadcrumbs && breadcrumbs.length > 0) {
        schema = generateBreadcrumbSchema(breadcrumbs);
      }
      break;

    case 'organization':
      if (organization) {
        schema = generateOrganizationSchema(organization);
      }
      break;

    default:
      console.warn(`Unknown structured data type: ${type}`);
  }

  // Don't render if no schema generated
  if (!schema) {
    return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default StructuredData;
