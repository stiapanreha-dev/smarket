import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogService } from './catalog.service';
import { Product, ProductStatus, ProductType } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import {
  ProductTranslation,
  TranslationLocale,
} from '../../database/entities/product-translation.entity';
import { ProductImage } from '../../database/entities/product-image.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CatalogService', () => {
  let service: CatalogService;
  let productRepository: Repository<Product>;
  let variantRepository: Repository<ProductVariant>;
  let translationRepository: Repository<ProductTranslation>;
  let imageRepository: Repository<ProductImage>;
  let auditLogService: AuditLogService;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVariantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockTranslationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAuditLogService = {
    createLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepository,
        },
        {
          provide: getRepositoryToken(ProductTranslation),
          useValue: mockTranslationRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockImageRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    variantRepository = module.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
    translationRepository = module.get<Repository<ProductTranslation>>(
      getRepositoryToken(ProductTranslation),
    );
    imageRepository = module.get<Repository<ProductImage>>(getRepositoryToken(ProductImage));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    const merchantId = 'merchant-123';
    const userId = 'user-123';

    const createProductDto = {
      type: ProductType.PHYSICAL,
      base_price_minor: 19999,
      currency: 'USD',
      translations: [
        {
          locale: TranslationLocale.EN,
          title: 'Premium Headphones',
          description: 'High quality headphones',
        },
        {
          locale: TranslationLocale.RU,
          title: 'Премиум наушники',
          description: 'Высококачественные наушники',
        },
        {
          locale: TranslationLocale.AR,
          title: 'سماعات بريميوم',
          description: 'سماعات عالية الجودة',
        },
      ],
    };

    it('should create a product with all translations', async () => {
      const mockProduct = {
        id: 'product-123',
        ...createProductDto,
        status: ProductStatus.DRAFT,
        merchant_id: merchantId,
      };

      mockProductRepository.create.mockReturnValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(mockProduct);
      mockTranslationRepository.create.mockImplementation((data) => data);
      mockTranslationRepository.findOne.mockResolvedValue(null); // No duplicate slug
      mockVariantRepository.create.mockImplementation((data) => data);
      mockProductRepository.findOne.mockResolvedValue({
        ...mockProduct,
        translations: createProductDto.translations,
        variants: [],
        product_images: [],
      });

      const result = await service.createProduct(merchantId, createProductDto, userId);

      expect(result).toBeDefined();
      expect(mockProductRepository.create).toHaveBeenCalled();
      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.createLog).toHaveBeenCalled();
    });

    it('should throw BadRequestException if missing required locales', async () => {
      const invalidDto = {
        ...createProductDto,
        translations: [createProductDto.translations[0]], // Only EN
      };

      await expect(service.createProduct(merchantId, invalidDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOneById', () => {
    it('should return a product by ID', async () => {
      const productId = 'product-123';
      const mockProduct = {
        id: productId,
        type: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOneById(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['translations', 'variants', 'product_images', 'merchant'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'non-existent';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById(productId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const productId = 'product-123';
      const merchantId = 'merchant-123';
      const userId = 'user-123';

      const existingProduct = {
        id: productId,
        merchant_id: merchantId,
        type: ProductType.PHYSICAL,
        status: ProductStatus.DRAFT,
        base_price_minor: 19999,
        translations: [],
        variants: [],
        product_images: [],
      };

      const updateDto = {
        status: ProductStatus.ACTIVE,
        base_price_minor: 24999,
      };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockProductRepository.save.mockResolvedValue({
        ...existingProduct,
        ...updateDto,
      });

      const result = await service.updateProduct(productId, merchantId, updateDto, userId);

      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.createLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'non-existent';
      const merchantId = 'merchant-123';
      const userId = 'user-123';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProduct(productId, merchantId, {}, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      const productId = 'product-123';
      const merchantId = 'merchant-123';
      const userId = 'user-123';

      const existingProduct = {
        id: productId,
        merchant_id: merchantId,
        status: ProductStatus.ACTIVE,
      };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockProductRepository.save.mockResolvedValue({
        ...existingProduct,
        status: ProductStatus.DELETED,
      });

      await service.deleteProduct(productId, merchantId, userId);

      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProductStatus.DELETED,
        }),
      );
      expect(mockAuditLogService.createLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'non-existent';
      const merchantId = 'merchant-123';
      const userId = 'user-123';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct(productId, merchantId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchProducts', () => {
    it('should search and return products', async () => {
      const searchDto = {
        q: 'headphones',
        locale: TranslationLocale.EN,
        limit: 20,
        offset: 0,
      };

      const mockProducts = [
        {
          id: 'product-1',
          type: ProductType.PHYSICAL,
          status: ProductStatus.ACTIVE,
        },
        {
          id: 'product-2',
          type: ProductType.PHYSICAL,
          status: ProductStatus.ACTIVE,
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockProducts, 2]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchProducts(searchDto);

      expect(result).toEqual({
        products: mockProducts,
        total: 2,
        limit: 20,
        offset: 0,
      });
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
