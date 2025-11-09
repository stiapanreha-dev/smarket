import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CacheService } from '../../common/services/cache.service';
import { Product, ProductStatus, ProductType } from '../../database/entities/product.entity';
import {
  ProductVariant,
  InventoryPolicy,
  VariantStatus,
} from '../../database/entities/product-variant.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';

describe('CartService', () => {
  let service: CartService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockVariantRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return existing cart from cache', async () => {
      const userId = 'user-123';
      const mockCart = {
        id: 'cart-123',
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.get.mockResolvedValue(mockCart);

      const result = await service.getCart(userId);

      expect(result).toEqual(mockCart);
      expect(mockCacheService.get).toHaveBeenCalledWith('cart:user:user-123');
    });

    it('should create empty cart if not found in cache', async () => {
      const sessionId = 'session-123';
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.getCart(undefined, sessionId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(result.items).toEqual([]);
      expect(result.expiresAt).toBeDefined();
    });

    it('should throw error if neither userId nor sessionId provided', async () => {
      await expect(service.getCart()).rejects.toThrow(BadRequestException);
    });
  });

  describe('addToCart', () => {
    const userId = 'user-123';
    const mockProduct: Partial<Product> = {
      id: 'product-123',
      merchant_id: 'merchant-123',
      type: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
    };

    const mockVariant: Partial<ProductVariant> = {
      id: 'variant-123',
      product_id: 'product-123',
      price_minor: 1000,
      currency: 'USD',
      status: VariantStatus.ACTIVE,
      inventory_quantity: 10,
      inventory_policy: InventoryPolicy.DENY,
    };

    const addItemDto: AddToCartDto = {
      productId: 'product-123',
      variantId: 'variant-123',
      quantity: 2,
    };

    beforeEach(() => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should add new item to cart', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantRepository.findOne.mockResolvedValue(mockVariant);

      const result = await service.addToCart(userId, undefined, addItemDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        productId: 'product-123',
        variantId: 'variant-123',
        quantity: 2,
        price: 1000,
        currency: 'USD',
        merchantId: 'merchant-123',
        type: 'physical',
      });

      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should update quantity if item already in cart', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-123',
            variantId: 'variant-123',
            quantity: 1,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-123',
            type: 'physical',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantRepository.findOne.mockResolvedValue(mockVariant);

      const result = await service.addToCart(userId, undefined, addItemDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3);
    });

    it('should throw error if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.addToCart(userId, undefined, addItemDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if product is not active', async () => {
      mockProductRepository.findOne.mockResolvedValue({
        ...mockProduct,
        status: ProductStatus.INACTIVE,
      });

      await expect(service.addToCart(userId, undefined, addItemDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if variant not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantRepository.findOne.mockResolvedValue(null);

      await expect(service.addToCart(userId, undefined, addItemDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if insufficient inventory', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantRepository.findOne.mockResolvedValue({
        ...mockVariant,
        inventory_quantity: 1,
      });

      await expect(service.addToCart(userId, undefined, addItemDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow adding item if inventory policy is CONTINUE', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantRepository.findOne.mockResolvedValue({
        ...mockVariant,
        inventory_quantity: 0,
        inventory_policy: InventoryPolicy.CONTINUE,
      });

      const result = await service.addToCart(userId, undefined, addItemDto);

      expect(result.items).toHaveLength(1);
    });

    it('should throw error if cart has max items', async () => {
      const items = Array(50)
        .fill(null)
        .map((_, i) => ({
          productId: `product-${i}`,
          variantId: `variant-${i}`,
          quantity: 1,
          price: 1000,
          currency: 'USD',
          merchantId: 'merchant-123',
          type: 'physical' as const,
        }));

      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.addToCart(userId, undefined, addItemDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if quantity exceeds max per item', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-123',
            variantId: 'variant-123',
            quantity: 98,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-123',
            type: 'physical',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantRepository.findOne.mockResolvedValue(mockVariant);

      await expect(service.addToCart(userId, undefined, addItemDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateQuantity', () => {
    const userId = 'user-123';

    it('should update item quantity', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-123',
            variantId: 'variant-123',
            quantity: 1,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-123',
            type: 'digital',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateQuantity(userId, undefined, 'product-123-variant-123', 5);

      expect(result.items[0].quantity).toBe(5);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should remove item if quantity is 0', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-123',
            variantId: 'variant-123',
            quantity: 1,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-123',
            type: 'digital',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateQuantity(userId, undefined, 'product-123-variant-123', 0);

      expect(result.items).toHaveLength(0);
    });

    it('should throw error if item not found', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.updateQuantity(userId, undefined, 'product-123-variant-123', 5),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromCart', () => {
    const userId = 'user-123';

    it('should remove item from cart', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-123',
            variantId: 'variant-123',
            quantity: 1,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-123',
            type: 'digital',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.removeFromCart(userId, undefined, 'product-123-variant-123');

      expect(result.items).toHaveLength(0);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.removeFromCart(userId, undefined, 'product-123-variant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const userId = 'user-123';
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-123',
            variantId: 'variant-123',
            quantity: 1,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-123',
            type: 'digital',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.clearCart(userId);

      expect(result.items).toHaveLength(0);
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('mergeGuestCart', () => {
    it('should merge guest cart into user cart', async () => {
      const guestSessionId = 'session-123';
      const userId = 'user-123';

      mockCacheService.get
        .mockResolvedValueOnce({
          id: 'guest-cart',
          sessionId: guestSessionId,
          items: [
            {
              productId: 'product-1',
              variantId: 'variant-1',
              quantity: 2,
              price: 1000,
              currency: 'USD',
              merchantId: 'merchant-123',
              type: 'digital',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'user-cart',
          userId,
          items: [
            {
              productId: 'product-2',
              variantId: 'variant-2',
              quantity: 1,
              price: 2000,
              currency: 'USD',
              merchantId: 'merchant-123',
              type: 'physical',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockProductRepository.findOne.mockResolvedValue({
        id: 'product-1',
        status: ProductStatus.ACTIVE,
      });

      mockVariantRepository.findOne.mockResolvedValue({
        id: 'variant-1',
        status: VariantStatus.ACTIVE,
        price_minor: 1000,
      });

      const result = await service.mergeGuestCart(guestSessionId, userId);

      expect(result.items).toHaveLength(2);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`cart:session:${guestSessionId}`);
    });

    it('should combine quantities for same items', async () => {
      const guestSessionId = 'session-123';
      const userId = 'user-123';

      mockCacheService.get
        .mockResolvedValueOnce({
          id: 'guest-cart',
          sessionId: guestSessionId,
          items: [
            {
              productId: 'product-1',
              variantId: 'variant-1',
              quantity: 2,
              price: 1000,
              currency: 'USD',
              merchantId: 'merchant-123',
              type: 'digital',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'user-cart',
          userId,
          items: [
            {
              productId: 'product-1',
              variantId: 'variant-1',
              quantity: 3,
              price: 1000,
              currency: 'USD',
              merchantId: 'merchant-123',
              type: 'digital',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockProductRepository.findOne.mockResolvedValue({
        id: 'product-1',
        status: ProductStatus.ACTIVE,
      });

      mockVariantRepository.findOne.mockResolvedValue({
        id: 'variant-1',
        status: VariantStatus.ACTIVE,
        price_minor: 1000,
      });

      const result = await service.mergeGuestCart(guestSessionId, userId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(5);
    });

    it('should return user cart if guest cart is empty', async () => {
      const guestSessionId = 'session-123';
      const userId = 'user-123';

      mockCacheService.get
        .mockResolvedValueOnce({
          id: 'guest-cart',
          sessionId: guestSessionId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'user-cart',
          userId,
          items: [
            {
              productId: 'product-1',
              variantId: 'variant-1',
              quantity: 1,
              price: 1000,
              currency: 'USD',
              merchantId: 'merchant-123',
              type: 'digital',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.mergeGuestCart(guestSessionId, userId);

      expect(result.items).toHaveLength(1);
      expect(mockCacheService.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCartSummary', () => {
    it('should calculate cart summary correctly', async () => {
      const userId = 'user-123';
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [
          {
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 2,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-1',
            type: 'digital',
          },
          {
            productId: 'product-2',
            variantId: 'variant-2',
            quantity: 1,
            price: 2000,
            currency: 'USD',
            merchantId: 'merchant-2',
            type: 'physical',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock product and variant for validation
      mockProductRepository.findOne.mockImplementation((options) => {
        if (options.where.id === 'product-1') {
          return Promise.resolve({
            id: 'product-1',
            status: ProductStatus.ACTIVE,
          });
        }
        if (options.where.id === 'product-2') {
          return Promise.resolve({
            id: 'product-2',
            status: ProductStatus.ACTIVE,
          });
        }
        return Promise.resolve(null);
      });

      mockVariantRepository.findOne.mockImplementation((options) => {
        if (options.where.id === 'variant-1') {
          return Promise.resolve({
            id: 'variant-1',
            status: VariantStatus.ACTIVE,
            price_minor: 1000,
          });
        }
        if (options.where.id === 'variant-2') {
          return Promise.resolve({
            id: 'variant-2',
            status: VariantStatus.ACTIVE,
            price_minor: 2000,
          });
        }
        return Promise.resolve(null);
      });

      const summary = await service.getCartSummary(userId);

      expect(summary.itemCount).toBe(3);
      expect(summary.subtotal).toBe(4000);
      expect(summary.tax).toBe(400);
      expect(summary.total).toBe(4400);
      expect(summary.merchantCount).toBe(2);
      expect(summary.currency).toBe('USD');
    });

    it('should return empty summary for empty cart', async () => {
      const userId = 'user-123';
      mockCacheService.get.mockResolvedValue({
        id: 'cart-123',
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const summary = await service.getCartSummary(userId);

      expect(summary.itemCount).toBe(0);
      expect(summary.subtotal).toBe(0);
      expect(summary.total).toBe(0);
    });
  });
});
