import { Controller, Get, Header } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product, ProductStatus } from '@/database/entities';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Catalog Sitemap Controller
 *
 * Generates dynamic XML sitemaps for product pages to help search engines
 * discover and index product content.
 *
 * Features:
 * - Dynamic product sitemap generation
 * - Includes all active products
 * - Updates automatically as products are added/modified
 * - Proper XML formatting with lastmod dates
 */
@Controller()
export class CatalogSitemapController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Generate dynamic sitemap for all products
   *
   * Returns XML sitemap with URLs for all active products
   * Search engines can use this to discover product pages
   *
   * @returns XML sitemap
   */
  @Get('sitemap-products.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  async getProductsSitemap(): Promise<string> {
    // Fetch all active products (limit to prevent huge sitemaps)
    // Note: For large catalogs, consider splitting into multiple sitemaps
    const products = await this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      select: ['id', 'updated_at'],
      take: 50000, // Google's sitemap limit
      order: { updated_at: 'DESC' },
    });

    // Generate XML sitemap
    const baseUrl = process.env.FRONTEND_URL || 'https://snailmarketplace.com';

    const urlEntries = products
      .map((product) => {
        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        return `  <url>
    <loc>${baseUrl}/catalog/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
  }

  /**
   * Generate sitemap index (master sitemap)
   *
   * Returns a sitemap index that references both static and dynamic sitemaps
   * Useful for organizing multiple sitemaps
   *
   * @returns XML sitemap index
   */
  @Get('sitemap-index.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  async getSitemapIndex(): Promise<string> {
    const baseUrl = process.env.FRONTEND_URL || 'https://snailmarketplace.com';
    const today = new Date().toISOString().split('T')[0];

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-products.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  }
}
