import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

describe('CartController', () => {
  let controller: CartController;

  const mockCartService = {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    mergeGuestCart: jest.fn(),
    getCartSummary: jest.fn(),
  };

  const mockCart = {
    id: 'cart-123',
    userId: 'user-123',
    items: [
      {
        productId: 'product-123',
        variantId: 'variant-123',
        quantity: 2,
        price: 1000,
        currency: 'USD',
        merchantId: 'merchant-123',
        type: 'digital' as const,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSummary = {
    itemCount: 2,
    subtotal: 2000,
    tax: 200,
    shipping: 0,
    total: 2200,
    currency: 'USD',
    merchantCount: 1,
    itemsByMerchant: {
      'merchant-123': [mockCart.items[0]],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should return cart and summary', async () => {
      mockCartService.getCart.mockResolvedValue(mockCart);
      mockCartService.getCartSummary.mockResolvedValue(mockSummary);

      const result = await controller.getCart('user-123');

      expect(result).toEqual({
        cart: mockCart,
        summary: mockSummary,
      });
      expect(mockCartService.getCart).toHaveBeenCalledWith('user-123', expect.any(String));
      expect(mockCartService.getCartSummary).toHaveBeenCalledWith('user-123', expect.any(String));
    });

    it('should work with session ID for guest users', async () => {
      mockCartService.getCart.mockResolvedValue(mockCart);
      mockCartService.getCartSummary.mockResolvedValue(mockSummary);

      const session = { id: 'session-123' };
      await controller.getCart(undefined, session);

      expect(mockCartService.getCart).toHaveBeenCalledWith(undefined, 'session-123');
    });
  });

  describe('addToCart', () => {
    const addItemDto: AddToCartDto = {
      productId: 'product-123',
      variantId: 'variant-123',
      quantity: 2,
    };

    it('should add item to cart', async () => {
      mockCartService.addToCart.mockResolvedValue(mockCart);

      const result = await controller.addToCart(addItemDto, 'user-123');

      expect(result).toEqual(mockCart);
      expect(mockCartService.addToCart).toHaveBeenCalledWith(
        'user-123',
        expect.any(String),
        addItemDto,
      );
    });

    it('should work for guest users', async () => {
      mockCartService.addToCart.mockResolvedValue(mockCart);

      const session = { id: 'session-123' };
      await controller.addToCart(addItemDto, undefined, session);

      expect(mockCartService.addToCart).toHaveBeenCalledWith(undefined, 'session-123', addItemDto);
    });
  });

  describe('updateQuantity', () => {
    const updateDto: UpdateCartItemDto = {
      quantity: 5,
    };

    it('should update item quantity', async () => {
      mockCartService.updateQuantity.mockResolvedValue(mockCart);

      const result = await controller.updateQuantity(
        'product-123-variant-123',
        updateDto,
        'user-123',
      );

      expect(result).toEqual(mockCart);
      expect(mockCartService.updateQuantity).toHaveBeenCalledWith(
        'user-123',
        undefined,
        'product-123-variant-123',
        5,
      );
    });

    it('should work with session ID', async () => {
      mockCartService.updateQuantity.mockResolvedValue(mockCart);

      const session = { id: 'session-123' };
      await controller.updateQuantity('product-123-variant-123', updateDto, undefined, session);

      expect(mockCartService.updateQuantity).toHaveBeenCalledWith(
        undefined,
        'session-123',
        'product-123-variant-123',
        5,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      mockCartService.removeFromCart.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const result = await controller.removeItem('product-123-variant-123', 'user-123');

      expect(result.items).toHaveLength(0);
      expect(mockCartService.removeFromCart).toHaveBeenCalledWith(
        'user-123',
        undefined,
        'product-123-variant-123',
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      mockCartService.clearCart.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const result = await controller.clearCart('user-123');

      expect(result.items).toHaveLength(0);
      expect(mockCartService.clearCart).toHaveBeenCalledWith('user-123', undefined);
    });
  });

  describe('mergeCart', () => {
    it('should merge guest cart into user cart', async () => {
      mockCartService.mergeGuestCart.mockResolvedValue(mockCart);

      const result = await controller.mergeCart('user-123', 'session-123');

      expect(result).toEqual(mockCart);
      expect(mockCartService.mergeGuestCart).toHaveBeenCalledWith('session-123', 'user-123');
    });

    it('should throw error if user ID not provided', async () => {
      await expect(controller.mergeCart('', 'session-123')).rejects.toThrow();
    });
  });

  describe('getCartSummary', () => {
    it('should return cart summary', async () => {
      mockCartService.getCartSummary.mockResolvedValue(mockSummary);

      const result = await controller.getCartSummary('user-123');

      expect(result).toEqual(mockSummary);
      expect(mockCartService.getCartSummary).toHaveBeenCalledWith('user-123', expect.any(String));
    });
  });
});
