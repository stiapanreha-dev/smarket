import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Product, ProductStatus } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { ProductTranslation } from '../../database/entities/product-translation.entity';
import { CacheService } from '../../common/services/cache.service';
import {
  AdvancedSearchProductsDto,
  SortOption,
  AvailabilityFilter,
} from './dto/advanced-search-products.dto';

export interface SearchResult {
  data: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    total_pages: number;
    next_cursor?: string;
  };
  facets?: {
    types: Record<string, number>;
    price_ranges: Record<string, number>;
    merchants: Record<string, number>;
    availability: {
      in_stock: number;
      out_of_stock: number;
    };
  };
  performance?: {
    query_time_ms: number;
    cache_hit: boolean;
  };
}

export interface HighlightedProduct extends Product {
  _highlights?: {
    title?: string;
    description?: string;
  };
}

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductTranslation)
    private readonly translationRepository: Repository<ProductTranslation>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Advanced product search with facets and caching
   */
  async search(searchDto: AdvancedSearchProductsDto): Promise<SearchResult> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = this.cacheService.generateSearchCacheKey(searchDto);

    // Try to get from cache
    const cached = await this.cacheService.get<SearchResult>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search query: ${cacheKey}`);
      return {
        ...cached,
        performance: {
          query_time_ms: Date.now() - startTime,
          cache_hit: true,
        },
      };
    }

    // Build query
    const query = this.buildSearchQuery(searchDto);

    // Execute count query for total
    const total = await query.getCount();

    // Apply pagination
    this.applyPagination(query, searchDto);

    // Execute search
    const products = await query.getMany();

    // Apply highlighting if requested
    const data = searchDto.highlight
      ? await this.applyHighlighting(products, searchDto.q, searchDto.locale)
      : products;

    // Build pagination info
    const pagination = this.buildPaginationInfo(searchDto, total);

    // Build result
    const result: SearchResult = {
      data,
      pagination,
      performance: {
        query_time_ms: Date.now() - startTime,
        cache_hit: false,
      },
    };

    // Add facets if requested
    if (searchDto.include_facets) {
      result.facets = await this.buildFacets(searchDto);
    }

    // Cache the result (without performance info)
    const cacheableResult = { ...result };
    delete cacheableResult.performance;
    await this.cacheService.set(cacheKey, cacheableResult, this.CACHE_TTL);

    this.logger.log(
      `Search completed in ${result.performance?.query_time_ms}ms, returned ${data.length} of ${total} products`,
    );

    return result;
  }

  /**
   * Build search query with all filters
   */
  private buildSearchQuery(searchDto: AdvancedSearchProductsDto): SelectQueryBuilder<Product> {
    const {
      q,
      type,
      status,
      merchant_id,
      price_min,
      price_max,
      attributes,
      availability,
      sku,
      sort,
      locale = 'en',
    } = searchDto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.product_images', 'image')
      .leftJoinAndSelect('product.merchant', 'merchant')
      .where('translation.locale = :locale', { locale });

    // Status filter (default to ACTIVE)
    const productStatus = status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status: productStatus });

    // Full-text search with pg_trgm for fuzzy matching
    if (q) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`translation.search_vector @@ plainto_tsquery('simple', :query)`, { query: q })
            .orWhere(`translation.title ILIKE :likeQuery`, { likeQuery: `%${q}%` })
            .orWhere(`translation.description ILIKE :likeQuery`, { likeQuery: `%${q}%` })
            .orWhere(`similarity(translation.title, :query) > 0.3`, { query: q });
        }),
      );
    }

    // SKU search with fuzzy matching
    if (sku) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`variant.sku ILIKE :skuLike`, { skuLike: `%${sku}%` }).orWhere(
            `similarity(variant.sku, :sku) > 0.3`,
            { sku },
          );
        }),
      );
    }

    // Type filter (supports multiple types)
    if (type && type.length > 0) {
      query.andWhere('product.type IN (:...types)', { types: type });
    }

    // Merchant filter
    if (merchant_id) {
      query.andWhere('product.merchant_id = :merchant_id', { merchant_id });
    }

    // Price range filter
    if (price_min !== undefined || price_max !== undefined) {
      if (price_min !== undefined) {
        query.andWhere('variant.price_minor >= :price_min', { price_min });
      }
      if (price_max !== undefined) {
        query.andWhere('variant.price_minor <= :price_max', { price_max });
      }
    }

    // Availability filter
    if (availability && availability !== AvailabilityFilter.ALL) {
      if (availability === AvailabilityFilter.IN_STOCK) {
        query.andWhere('variant.inventory_quantity > 0');
      } else if (availability === AvailabilityFilter.OUT_OF_STOCK) {
        query.andWhere('variant.inventory_quantity = 0');
      }
    }

    // Attribute filters (dynamic JSONB queries)
    if (attributes && Object.keys(attributes).length > 0) {
      Object.entries(attributes).forEach(([key, value], index) => {
        if (value !== null && value !== undefined) {
          // Check both product attrs and variant attrs
          query.andWhere(
            new Brackets((qb) => {
              qb.where(`product.attrs @> :attr${index}::jsonb`, {
                [`attr${index}`]: JSON.stringify({ [key]: value }),
              }).orWhere(`variant.attrs @> :attr${index}::jsonb`, {
                [`attr${index}`]: JSON.stringify({ [key]: value }),
              });
            }),
          );
        }
      });
    }

    // Apply sorting
    this.applySorting(query, sort || SortOption.RELEVANCE, q);

    return query;
  }

  /**
   * Apply sorting to query
   */
  private applySorting(
    query: SelectQueryBuilder<Product>,
    sort: SortOption,
    searchQuery?: string,
  ): void {
    switch (sort) {
      case SortOption.PRICE_ASC:
        query.orderBy('variant.price_minor', 'ASC', 'NULLS LAST');
        break;

      case SortOption.PRICE_DESC:
        query.orderBy('variant.price_minor', 'DESC', 'NULLS LAST');
        break;

      case SortOption.CREATED_AT_DESC:
        query.orderBy('product.created_at', 'DESC');
        break;

      case SortOption.POPULARITY:
        query.orderBy('product.sales_count', 'DESC').addOrderBy('product.view_count', 'DESC');
        break;

      case SortOption.RATING:
        query
          .orderBy('product.rating', 'DESC', 'NULLS LAST')
          .addOrderBy('product.review_count', 'DESC');
        break;

      case SortOption.RELEVANCE:
      default:
        if (searchQuery) {
          // Add relevance scoring for text search
          query.addSelect(
            `ts_rank(translation.search_vector, plainto_tsquery('simple', :searchQuery))`,
            'relevance_score',
          );
          query.setParameter('searchQuery', searchQuery);
          query.orderBy('relevance_score', 'DESC');
        } else {
          // Default to newest if no search query
          query.orderBy('product.created_at', 'DESC');
        }
        break;
    }

    // Add secondary sort by ID for consistency
    query.addOrderBy('product.id', 'ASC');
  }

  /**
   * Apply pagination
   */
  private applyPagination(
    query: SelectQueryBuilder<Product>,
    searchDto: AdvancedSearchProductsDto,
  ): void {
    const { limit = 20, offset = 0, cursor } = searchDto;

    if (cursor) {
      // Cursor-based pagination
      try {
        const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        if (decodedCursor.id && decodedCursor.created_at) {
          query.andWhere(
            new Brackets((qb) => {
              qb.where('product.created_at < :cursor_created_at', {
                cursor_created_at: decodedCursor.created_at,
              }).orWhere(
                new Brackets((qb2) => {
                  qb2
                    .where('product.created_at = :cursor_created_at', {
                      cursor_created_at: decodedCursor.created_at,
                    })
                    .andWhere('product.id > :cursor_id', { cursor_id: decodedCursor.id });
                }),
              );
            }),
          );
        }
      } catch (error) {
        this.logger.warn(`Invalid cursor: ${cursor}`, error);
      }
    }

    query.skip(offset).take(limit);
  }

  /**
   * Build pagination info
   */
  private buildPaginationInfo(
    searchDto: AdvancedSearchProductsDto,
    total: number,
  ): SearchResult['pagination'] {
    const { limit = 20, offset = 0 } = searchDto;
    const page = Math.floor(offset / limit) + 1;
    const total_pages = Math.ceil(total / limit);

    const pagination: SearchResult['pagination'] = {
      total,
      limit,
      offset,
      page,
      total_pages,
    };

    // Add next cursor if there are more results
    if (offset + limit < total) {
      // Generate next cursor (would need last item from results)
      // This is a simplified version - in production, you'd use the actual last item
      const nextOffset = offset + limit;
      pagination.next_cursor = Buffer.from(JSON.stringify({ offset: nextOffset })).toString(
        'base64',
      );
    }

    return pagination;
  }

  /**
   * Build faceted search aggregations
   */
  private async buildFacets(searchDto: AdvancedSearchProductsDto): Promise<SearchResult['facets']> {
    const { locale = 'en', status = ProductStatus.ACTIVE } = searchDto;

    // Build base query for facets (without pagination)
    const baseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.translations', 'translation')
      .leftJoin('product.variants', 'variant')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status });

    // Apply search filter if present
    if (searchDto.q) {
      baseQuery.andWhere(
        new Brackets((qb) => {
          qb.where(`translation.search_vector @@ plainto_tsquery('simple', :query)`, {
            query: searchDto.q,
          })
            .orWhere(`translation.title ILIKE :likeQuery`, { likeQuery: `%${searchDto.q}%` })
            .orWhere(`translation.description ILIKE :likeQuery`, { likeQuery: `%${searchDto.q}%` });
        }),
      );
    }

    // Type facets
    const typeFacets = await this.productRepository
      .createQueryBuilder('product')
      .select('product.type', 'type')
      .addSelect('COUNT(DISTINCT product.id)', 'count')
      .leftJoin('product.translations', 'translation')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status })
      .groupBy('product.type')
      .getRawMany();

    const types = typeFacets.reduce(
      (acc, item) => {
        acc[item.type] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Price range facets
    const priceRanges = await this.calculatePriceRangeFacets();

    // Merchant facets (top 10 merchants)
    const merchantFacets = await this.productRepository
      .createQueryBuilder('product')
      .select('product.merchant_id', 'merchant_id')
      .addSelect('COUNT(DISTINCT product.id)', 'count')
      .leftJoin('product.translations', 'translation')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status })
      .groupBy('product.merchant_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const merchants = merchantFacets.reduce(
      (acc, item) => {
        acc[item.merchant_id] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Availability facets
    const availabilityFacets = await this.variantRepository
      .createQueryBuilder('variant')
      .select('SUM(CASE WHEN variant.inventory_quantity > 0 THEN 1 ELSE 0 END)', 'in_stock')
      .addSelect('SUM(CASE WHEN variant.inventory_quantity = 0 THEN 1 ELSE 0 END)', 'out_of_stock')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.translations', 'translation')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status })
      .getRawOne();

    return {
      types,
      price_ranges: priceRanges,
      merchants,
      availability: {
        in_stock: parseInt(availabilityFacets?.in_stock || '0', 10),
        out_of_stock: parseInt(availabilityFacets?.out_of_stock || '0', 10),
      },
    };
  }

  /**
   * Calculate price range facets
   */
  private async calculatePriceRangeFacets(): Promise<Record<string, number>> {
    const ranges = [
      { min: 0, max: 50000, label: '0-500' },
      { min: 50000, max: 100000, label: '500-1000' },
      { min: 100000, max: 200000, label: '1000-2000' },
      { min: 200000, max: Number.MAX_SAFE_INTEGER, label: '2000+' },
    ];

    const results: Record<string, number> = {};

    for (const range of ranges) {
      const count = await this.variantRepository
        .createQueryBuilder('variant')
        .leftJoin('variant.product', 'product')
        .leftJoin('product.translations', 'translation')
        .where('variant.price_minor >= :min', { min: range.min })
        .andWhere('variant.price_minor < :max', { max: range.max })
        .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
        .getCount();

      results[range.label] = count;
    }

    return results;
  }

  /**
   * Apply highlighting to search results
   */
  private async applyHighlighting(
    products: Product[],
    searchQuery?: string,
    locale: string = 'en',
  ): Promise<HighlightedProduct[]> {
    if (!searchQuery) {
      return products as HighlightedProduct[];
    }

    return products.map((product) => {
      const translation = product.getTranslation(locale);
      const highlighted = product as HighlightedProduct;

      if (translation) {
        highlighted._highlights = {
          title: this.highlightText(translation.title, searchQuery),
          description: translation.description
            ? this.highlightText(translation.description, searchQuery)
            : undefined,
        };
      }

      return highlighted;
    });
  }

  /**
   * Highlight matching terms in text
   */
  private highlightText(text: string, query: string): string {
    if (!text || !query) return text;

    const terms = query.split(/\s+/).filter((t) => t.length > 2);
    let highlightedText = text;

    terms.forEach((term) => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Invalidate search cache (call when products are updated)
   */
  async invalidateCache(): Promise<void> {
    await this.cacheService.invalidateSearchCache();
    this.logger.log('Search cache invalidated');
  }

  /**
   * Autocomplete search suggestions
   */
  async autocomplete(query: string, locale: string = 'en') {
    if (!query || query.length < 2) {
      return {
        products: [],
        services: [],
        categories: [],
      };
    }

    const cacheKey = `autocomplete:${locale}:${query.toLowerCase()}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Search for products (top 5)
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        `(translation.title ILIKE :query OR translation.description ILIKE :query)`,
        { query: `%${query}%` },
      )
      .andWhere('product.type IN (:...types)', { types: ['PHYSICAL', 'DIGITAL'] })
      .orderBy('product.sales_count', 'DESC')
      .addOrderBy('product.view_count', 'DESC')
      .take(5)
      .getMany();

    // Search for services (top 3)
    const services = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        `(translation.title ILIKE :query OR translation.description ILIKE :query)`,
        { query: `%${query}%` },
      )
      .andWhere('product.type = :type', { type: 'SERVICE' })
      .orderBy('product.sales_count', 'DESC')
      .addOrderBy('product.view_count', 'DESC')
      .take(3)
      .getMany();

    // Get unique categories from product attributes
    const categoriesResult = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.attrs->>\'category\'', 'category')
      .leftJoin('product.translations', 'translation')
      .where('translation.locale = :locale', { locale })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(`product.attrs->>\'category\' ILIKE :query`, { query: `%${query}%` })
      .andWhere(`product.attrs->>\'category\' IS NOT NULL`)
      .limit(5)
      .getRawMany();

    const categories = categoriesResult
      .map((item) => item.category)
      .filter((cat) => cat && cat.trim() !== '');

    const result = {
      products: products.map((p) => ({
        id: p.id,
        title: p.getTranslation(locale)?.title || '',
        image_url: p.image_url,
        price: p.variants?.[0]?.price_minor || p.base_price_minor,
        currency: p.currency,
        type: p.type,
      })),
      services: services.map((s) => ({
        id: s.id,
        title: s.getTranslation(locale)?.title || '',
        image_url: s.image_url,
        price: s.variants?.[0]?.price_minor || s.base_price_minor,
        currency: s.currency,
        type: s.type,
      })),
      categories,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }
}
