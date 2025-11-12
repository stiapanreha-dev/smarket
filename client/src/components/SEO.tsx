import { Helmet } from 'react-helmet-async';

interface SEOProps {
  /**
   * Page title (will be appended with " | SnailMarketplace")
   */
  title: string;

  /**
   * Meta description for search engines
   */
  description: string;

  /**
   * Meta keywords for search engines
   */
  keywords?: string;

  /**
   * Open Graph image URL
   */
  image?: string;

  /**
   * Canonical URL (defaults to current page URL)
   */
  url?: string;

  /**
   * Open Graph type (default: 'website')
   */
  type?: 'website' | 'product' | 'article';

  /**
   * Product-specific price for rich snippets
   */
  price?: string;

  /**
   * Product-specific currency
   */
  currency?: string;

  /**
   * Product-specific availability
   */
  availability?: 'in stock' | 'out of stock' | 'preorder';

  /**
   * Article-specific publish date
   */
  publishedTime?: string;

  /**
   * Article-specific modified date
   */
  modifiedTime?: string;

  /**
   * Disable search engine indexing
   */
  noIndex?: boolean;

  /**
   * Disable following links
   */
  noFollow?: boolean;
}

/**
 * SEO Component for managing page metadata
 *
 * Features:
 * - Standard meta tags (title, description, keywords)
 * - Open Graph tags for social media sharing
 * - Twitter Card tags
 * - Product-specific meta tags
 * - Canonical URLs
 * - Robots directives
 *
 * @example
 * ```tsx
 * <SEO
 *   title="iPhone 14 Pro - $999"
 *   description="Buy iPhone 14 Pro with free shipping..."
 *   image={product.images[0]}
 *   type="product"
 *   price="999"
 *   currency="USD"
 *   availability="in stock"
 * />
 * ```
 */
export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  price,
  currency,
  availability,
  publishedTime,
  modifiedTime,
  noIndex = false,
  noFollow = false,
}: SEOProps) {
  // Generate full title
  const fullTitle = `${title} | SnailMarketplace`;

  // Get canonical URL (use provided URL or current page URL)
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Default image if not provided
  const defaultImage = '/og-image.png';
  const ogImage = image || defaultImage;

  // Robots directive
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SnailMarketplace" />
      <meta property="og:locale" content="en_US" />

      {/* Product-specific Open Graph tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={currency || 'USD'} />
        </>
      )}

      {type === 'product' && availability && (
        <meta property="product:availability" content={availability} />
      )}

      {/* Article-specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={type === 'product' ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO Meta Tags */}
      <meta name="author" content="SnailMarketplace" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />

      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    </Helmet>
  );
}

export default SEO;
