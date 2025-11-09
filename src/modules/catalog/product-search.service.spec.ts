import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSearchService } from './product-search.service';
import { Product, ProductType } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { ProductTranslation, TranslationLocale } from '../../database/entities/product-translation.entity';
import { CacheService } from '../../common/services/cache.service';
import {
  AdvancedSearchProductsDto,
  SortOption,
  AvailabilityFilter,
} from './dto/advanced-search-products.dto';

describe('ProductSearchService', () => {
  let service: ProductSearchService;
  let productRepository: Repository<Product>;
  let cacheService: CacheService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(10),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({}),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSearchService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(ProductTranslation),
          useValue: {},
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            generateSearchCacheKey: jest.fn().mockReturnValue('test-cache-key'),
            invalidateSearchCache: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProductSearchService>(ProductSearchService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const cachedResult = {
        data: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          page: 1,
          total_pages: 0,
        },
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedResult);

      const searchDto: AdvancedSearchProductsDto = {
        q: 'laptop',
        limit: 20,
        offset: 0,
      };

      const result = await service.search(searchDto);

      expect(result.performance?.cache_hit).toBe(true);
      expect(cacheService.get).toHaveBeenCalled();
    });

    it('should perform full-text search with query', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        q: 'gaming laptop',
        limit: 20,
        offset: 0,
        locale: TranslationLocale.EN,
      };

      await service.search(searchDto);

      expect(productRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by product type', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        type: [ProductType.PHYSICAL],
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by price range', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        price_min: 50000,
        price_max: 200000,
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by availability (in stock)', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        availability: AvailabilityFilter.IN_STOCK,
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by SKU', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        sku: 'SKU-123',
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by merchant ID', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        merchant_id: '123e4567-e89b-12d3-a456-426614174000',
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should sort by price ascending', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        sort: SortOption.PRICE_ASC,
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should sort by popularity', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        sort: SortOption.POPULARITY,
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should include facets when requested', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { type: 'PHYSICAL', count: '50' },
        { type: 'SERVICE', count: '30' },
      ]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        in_stock: '80',
        out_of_stock: '20',
      });

      const searchDto: AdvancedSearchProductsDto = {
        include_facets: true,
        limit: 20,
        offset: 0,
      };

      const result = await service.search(searchDto);

      expect(result.facets).toBeDefined();
      expect(result.facets?.types).toBeDefined();
      expect(result.facets?.price_ranges).toBeDefined();
      expect(result.facets?.availability).toBeDefined();
    });

    it('should apply pagination correctly', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(100);

      const searchDto: AdvancedSearchProductsDto = {
        limit: 20,
        offset: 40,
      };

      const result = await service.search(searchDto);

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.total_pages).toBe(5);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should cache search results', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        q: 'laptop',
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should filter by dynamic attributes', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        attributes: { brand: 'Apple', color: 'black' },
        limit: 20,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should enforce max limit of 100', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        limit: 100,
        offset: 0,
      };

      await service.search(searchDto);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should provide performance metrics', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const searchDto: AdvancedSearchProductsDto = {
        limit: 20,
        offset: 0,
      };

      const result = await service.search(searchDto);

      expect(result.performance).toBeDefined();
      expect(result.performance?.query_time_ms).toBeGreaterThanOrEqual(0);
      expect(result.performance?.cache_hit).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate search cache', async () => {
      await service.invalidateCache();

      expect(cacheService.invalidateSearchCache).toHaveBeenCalled();
    });
  });
});
