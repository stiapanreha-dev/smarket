# Sprint 3: Cart & Checkout
## Purchase Flow Foundation (День 16-20)

**Dates:** 5-9 Февраля 2024  
**Goal:** Реализовать корзину и процесс оформления заказа  
**Team Focus:** Backend - 50%, Frontend - 50%  

---

## 🎯 Sprint Goals

1. **Shopping Cart** - Управление корзиной с Redis
2. **Cart Persistence** - Сохранение для авторизованных пользователей
3. **Checkout Process** - Многошаговый процесс оформления
4. **Address Management** - Адреса доставки и оплаты
5. **Shipping Calculation** - Расчет стоимости доставки

---

## 📋 User Stories

### CART-001: Shopping Cart Management (8 SP)
**As a** customer  
**I want** to manage my shopping cart  
**So that** I can purchase multiple items  

**Acceptance Criteria:**
- [ ] Add items to cart (with variants)
- [ ] Update quantities
- [ ] Remove items
- [ ] Cart persists across sessions (logged in users)
- [ ] Guest cart merges on login
- [ ] Real-time inventory check

**Backend Implementation:**
```typescript
// src/modules/cart/entities/cart.entity.ts
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // Price at time of adding
  currency: string;
  merchantId: string;
  type: 'physical' | 'digital' | 'service';
  metadata?: {
    bookingDate?: Date;
    bookingSlot?: string;
    customization?: Record<string, any>;
  };
}

export interface Cart {
  id: string;
  userId?: string; // Optional for guest carts
  sessionId?: string; // For guest carts
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // For guest carts
}

// src/modules/cart/cart.service.ts
@Injectable()
export class CartService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly productService: ProductService,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getCart(userId?: string, sessionId?: string): Promise<Cart> {
    const cartKey = this.getCartKey(userId, sessionId);
    const cartData = await this.redis.get(cartKey);

    if (!cartData) {
      return this.createEmptyCart(userId, sessionId);
    }

    const cart = JSON.parse(cartData) as Cart;
    
    // Validate items are still available
    cart.items = await this.validateCartItems(cart.items);
    
    return cart;
  }

  async addToCart(
    userId: string | undefined,
    sessionId: string | undefined,
    addItemDto: AddToCartDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);
    
    // Check product exists and is available
    const product = await this.productService.getProductWithVariant(
      addItemDto.productId,
      addItemDto.variantId,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }

    // Check inventory for physical products
    if (product.type === 'physical') {
      const available = await this.inventoryService.checkAvailability(
        addItemDto.variantId,
        addItemDto.quantity,
      );

      if (!available) {
        throw new BadRequestException('Insufficient inventory');
      }
    }

    // Check for existing item
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === addItemDto.productId &&
              item.variantId === addItemDto.variantId,
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += addItemDto.quantity;
      
      // Validate new quantity
      if (product.type === 'physical') {
        const totalQuantity = cart.items[existingItemIndex].quantity;
        const available = await this.inventoryService.checkAvailability(
          addItemDto.variantId,
          totalQuantity,
        );

        if (!available) {
          throw new BadRequestException('Insufficient inventory for requested quantity');
        }
      }
    } else {
      // Add new item
      const cartItem: CartItem = {
        productId: addItemDto.productId,
        variantId: addItemDto.variantId,
        quantity: addItemDto.quantity,
        price: product.variant.price,
        currency: product.currency,
        merchantId: product.merchantId,
        type: product.type,
        metadata: addItemDto.metadata,
      };

      cart.items.push(cartItem);
    }

    // Update cart
    cart.updatedAt = new Date();
    await this.saveCart(cart);

    // Emit event
    this.eventEmitter.emit('cart.updated', {
      cartId: cart.id,
      userId: cart.userId,
      action: 'item_added',
      item: addItemDto,
    });

    return cart;
  }

  async updateQuantity(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    if (quantity <= 0) {
      return this.removeFromCart(userId, sessionId, itemId);
    }

    const cart = await this.getCart(userId, sessionId);
    const itemIndex = cart.items.findIndex(
      item => `${item.productId}-${item.variantId}` === itemId,
    );

    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    const item = cart.items[itemIndex];

    // Check inventory for physical products
    if (item.type === 'physical') {
      const available = await this.inventoryService.checkAvailability(
        item.variantId,
        quantity,
      );

      if (!available) {
        throw new BadRequestException('Insufficient inventory');
      }
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();
    
    await this.saveCart(cart);

    return cart;
  }

  async removeFromCart(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
  ): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);
    
    cart.items = cart.items.filter(
      item => `${item.productId}-${item.variantId}` !== itemId,
    );
    
    cart.updatedAt = new Date();
    await this.saveCart(cart);

    return cart;
  }

  async clearCart(userId?: string, sessionId?: string): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);
    cart.items = [];
    cart.updatedAt = new Date();
    await this.saveCart(cart);
    return cart;
  }

  async mergeGuestCart(guestSessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.getCart(undefined, guestSessionId);
    const userCart = await this.getCart(userId, undefined);

    if (guestCart.items.length === 0) {
      return userCart;
    }

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        item => item.productId === guestItem.productId &&
                item.variantId === guestItem.variantId,
      );

      if (existingItemIndex >= 0) {
        // Combine quantities
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item
        userCart.items.push(guestItem);
      }
    }

    // Validate all items
    userCart.items = await this.validateCartItems(userCart.items);
    userCart.updatedAt = new Date();

    // Save merged cart
    await this.saveCart(userCart);

    // Clear guest cart
    await this.clearCart(undefined, guestSessionId);

    return userCart;
  }

  private async saveCart(cart: Cart): Promise<void> {
    const cartKey = this.getCartKey(cart.userId, cart.sessionId);
    const ttl = cart.userId ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days for users, 7 days for guests
    
    await this.redis.setex(cartKey, ttl, JSON.stringify(cart));
  }

  private getCartKey(userId?: string, sessionId?: string): string {
    if (userId) {
      return `cart:user:${userId}`;
    }
    return `cart:session:${sessionId}`;
  }

  private createEmptyCart(userId?: string, sessionId?: string): Cart {
    return {
      id: uuid(),
      userId,
      sessionId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: userId ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private async validateCartItems(items: CartItem[]): Promise<CartItem[]> {
    const validatedItems: CartItem[] = [];

    for (const item of items) {
      try {
        const product = await this.productService.getProductWithVariant(
          item.productId,
          item.variantId,
        );

        if (product && product.status === 'active') {
          // Update price if changed
          if (item.price !== product.variant.price) {
            item.price = product.variant.price;
          }

          // Check inventory for physical products
          if (item.type === 'physical') {
            const available = await this.inventoryService.checkAvailability(
              item.variantId,
              item.quantity,
            );

            if (available) {
              validatedItems.push(item);
            }
          } else {
            validatedItems.push(item);
          }
        }
      } catch (error) {
        // Item no longer available, skip it
        console.warn(`Cart item ${item.productId} is no longer available`);
      }
    }

    return validatedItems;
  }

  async getCartSummary(userId?: string, sessionId?: string): Promise<CartSummary> {
    const cart = await this.getCart(userId, sessionId);
    
    // Group items by merchant for split payments
    const itemsByMerchant = _.groupBy(cart.items, 'merchantId');
    
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0,
    );

    // Calculate estimated tax (simplified)
    const taxRate = 0.10; // 10% default
    const tax = Math.round(subtotal * taxRate);

    // Shipping will be calculated in checkout
    const shipping = 0;

    return {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
      currency: cart.items[0]?.currency || 'USD',
      merchantCount: Object.keys(itemsByMerchant).length,
      itemsByMerchant,
    };
  }
}

// src/modules/cart/cart.controller.ts
@Controller('cart')
@ApiTags('Cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get cart' })
  async getCart(
    @CurrentUser() user?: User,
    @Session() session?: any,
  ) {
    const userId = user?.id;
    const sessionId = session?.id || this.generateSessionId();
    
    const cart = await this.cartService.getCart(userId, sessionId);
    const summary = await this.cartService.getCartSummary(userId, sessionId);
    
    return {
      cart,
      summary,
    };
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(
    @Body() addItemDto: AddToCartDto,
    @CurrentUser() user?: User,
    @Session() session?: any,
  ) {
    const userId = user?.id;
    const sessionId = session?.id || this.generateSessionId();
    
    return this.cartService.addToCart(userId, sessionId, addItemDto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
    @CurrentUser() user?: User,
    @Session() session?: any,
  ) {
    const userId = user?.id;
    const sessionId = session?.id;
    
    return this.cartService.updateQuantity(userId, sessionId, itemId, quantity);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user?: User,
    @Session() session?: any,
  ) {
    const userId = user?.id;
    const sessionId = session?.id;
    
    return this.cartService.removeFromCart(userId, sessionId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(
    @CurrentUser() user?: User,
    @Session() session?: any,
  ) {
    const userId = user?.id;
    const sessionId = session?.id;
    
    return this.cartService.clearCart(userId, sessionId);
  }

  private generateSessionId(): string {
    return uuid();
  }
}
```

---

### CART-002: Checkout Process (13 SP)
**As a** customer  
**I want** to complete checkout  
**So that** I can place my order  

**Acceptance Criteria:**
- [ ] Multi-step checkout flow
- [ ] Guest checkout option
- [ ] Address validation
- [ ] Shipping method selection
- [ ] Order summary
- [ ] Inventory reservation during checkout

**Database Schema:**
```sql
-- Addresses table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'shipping', -- shipping, billing
    is_default BOOLEAN DEFAULT false,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(2) NOT NULL,
    state VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_addresses (user_id, type)
);

-- Checkout sessions
CREATE TABLE checkout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    cart_snapshot JSONB NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method JSONB,
    payment_method VARCHAR(50),
    idempotency_key VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_checkout_status (status, expires_at)
);
```

**Backend Implementation:**
```typescript
// src/modules/checkout/dto/checkout.dto.ts
export class InitiateCheckoutDto {
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;
}

export class UpdateShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @Length(2, 2)
  country: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;
}

// src/modules/checkout/checkout.service.ts
@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession)
    private checkoutRepository: Repository<CheckoutSession>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly shippingService: ShippingService,
    private readonly outboxService: OutboxService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async initiateCheckout(
    userId?: string,
    sessionId?: string,
    guestData?: InitiateCheckoutDto,
  ): Promise<CheckoutSession> {
    // Get cart
    const cart = await this.cartService.getCart(userId, sessionId);
    
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Reserve inventory for physical products
    const reservations = await this.reserveInventory(cart.items);

    // Create checkout session
    const checkoutSession = this.checkoutRepository.create({
      userId,
      sessionId,
      status: 'pending',
      cartSnapshot: cart,
      idempotencyKey: uuid(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      metadata: {
        guestEmail: guestData?.guestEmail,
        guestPhone: guestData?.guestPhone,
        reservations,
      },
    });

    await this.checkoutRepository.save(checkoutSession);

    // Schedule expiry job
    await this.scheduleCheckoutExpiry(checkoutSession.id);

    return checkoutSession;
  }

  private async reserveInventory(items: CartItem[]): Promise<ReservationResult[]> {
    const reservations: ReservationResult[] = [];

    for (const item of items) {
      if (item.type === 'physical') {
        try {
          const reservation = await this.inventoryService.reserve(
            item.variantId,
            item.quantity,
            900, // 15 minutes TTL
          );
          
          reservations.push({
            variantId: item.variantId,
            reservationId: reservation.id,
            quantity: item.quantity,
          });
        } catch (error) {
          // Rollback previous reservations
          await this.rollbackReservations(reservations);
          throw new BadRequestException(`Product ${item.productId} is out of stock`);
        }
      }
    }

    return reservations;
  }

  private async rollbackReservations(reservations: ReservationResult[]): Promise<void> {
    for (const reservation of reservations) {
      await this.inventoryService.releaseReservation(reservation.reservationId);
    }
  }

  async updateShippingAddress(
    checkoutId: string,
    addressDto: UpdateShippingAddressDto,
  ): Promise<CheckoutSession> {
    const session = await this.checkoutRepository.findOne({
      where: { id: checkoutId, status: 'pending' },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found or expired');
    }

    // Validate address (simplified)
    const isValid = await this.validateAddress(addressDto);
    if (!isValid) {
      throw new BadRequestException('Invalid address');
    }

    // Save address if user is logged in
    if (session.userId && addressDto.saveAddress) {
      await this.saveUserAddress(session.userId, addressDto);
    }

    session.shippingAddress = addressDto;
    session.updatedAt = new Date();

    // Calculate shipping options
    const shippingOptions = await this.calculateShipping(session);
    session.availableShippingMethods = shippingOptions;

    await this.checkoutRepository.save(session);

    return session;
  }

  private async calculateShipping(
    session: CheckoutSession,
  ): Promise<ShippingOption[]> {
    const cart = session.cartSnapshot as Cart;
    
    // Get physical items
    const physicalItems = cart.items.filter(item => item.type === 'physical');
    
    if (physicalItems.length === 0) {
      return []; // No shipping needed
    }

    // Calculate total weight
    const totalWeight = physicalItems.reduce((sum, item) => {
      return sum + (item.weight || 500) * item.quantity; // Default 500g
    }, 0);

    // Get shipping options from providers
    const options: ShippingOption[] = [];

    // Standard shipping
    options.push({
      id: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: this.calculateShippingPrice(totalWeight, 'standard'),
      estimatedDays: { min: 5, max: 7 },
    });

    // Express shipping
    options.push({
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: this.calculateShippingPrice(totalWeight, 'express'),
      estimatedDays: { min: 2, max: 3 },
    });

    // Next day delivery (if available)
    if (this.isNextDayAvailable(session.shippingAddress)) {
      options.push({
        id: 'nextday',
        name: 'Next Day Delivery',
        description: 'Delivery by tomorrow',
        price: this.calculateShippingPrice(totalWeight, 'nextday'),
        estimatedDays: { min: 1, max: 1 },
      });
    }

    return options;
  }

  private calculateShippingPrice(weight: number, method: string): number {
    // Simplified calculation
    const rates = {
      standard: { base: 500, perKg: 200 }, // 5 USD base + 2 USD per kg
      express: { base: 1000, perKg: 400 },  // 10 USD base + 4 USD per kg
      nextday: { base: 2000, perKg: 600 },  // 20 USD base + 6 USD per kg
    };

    const rate = rates[method];
    const weightInKg = Math.ceil(weight / 1000);
    
    return rate.base + (rate.perKg * weightInKg);
  }

  async selectShippingMethod(
    checkoutId: string,
    shippingMethodId: string,
  ): Promise<CheckoutSession> {
    const session = await this.checkoutRepository.findOne({
      where: { id: checkoutId, status: 'pending' },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    const selectedMethod = session.availableShippingMethods.find(
      m => m.id === shippingMethodId,
    );

    if (!selectedMethod) {
      throw new BadRequestException('Invalid shipping method');
    }

    session.shippingMethod = selectedMethod;
    session.updatedAt = new Date();

    await this.checkoutRepository.save(session);

    return session;
  }

  async getCheckoutSummary(checkoutId: string): Promise<CheckoutSummary> {
    const session = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    const cart = session.cartSnapshot as Cart;
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0,
    );

    // Calculate tax based on shipping address
    const taxRate = await this.getTaxRate(session.shippingAddress);
    const tax = Math.round(subtotal * taxRate);

    const shipping = session.shippingMethod?.price || 0;
    const total = subtotal + tax + shipping;

    return {
      items: cart.items,
      subtotal,
      tax,
      taxRate,
      shipping,
      shippingMethod: session.shippingMethod,
      total,
      currency: cart.items[0]?.currency || 'USD',
      shippingAddress: session.shippingAddress,
      billingAddress: session.billingAddress || session.shippingAddress,
    };
  }

  private async getTaxRate(address: any): Promise<number> {
    if (!address) return 0;

    // Simplified tax calculation
    const taxRates = {
      'AE': 0.05,  // UAE VAT 5%
      'RU': 0.20,  // Russia VAT 20%
      'US': 0.08,  // US average ~8%
    };

    return taxRates[address.country] || 0.10;
  }

  async completeCheckout(
    checkoutId: string,
    paymentMethodId: string,
  ): Promise<Order> {
    const session = await this.checkoutRepository.findOne({
      where: { id: checkoutId, status: 'pending' },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    // Validate session hasn't expired
    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Checkout session has expired');
    }

    // Start transaction
    return await this.checkoutRepository.manager.transaction(async manager => {
      // Create order
      const order = await this.createOrder(session, paymentMethodId, manager);

      // Update checkout session
      session.status = 'completed';
      session.orderId = order.id;
      await manager.save(session);

      // Emit events through outbox
      await this.outboxService.addEvent(
        'checkout.completed',
        {
          checkoutId: session.id,
          orderId: order.id,
          userId: session.userId,
        },
        manager,
      );

      // Clear cart
      await this.cartService.clearCart(session.userId, session.sessionId);

      return order;
    });
  }

  private async scheduleCheckoutExpiry(checkoutId: string): Promise<void> {
    // Schedule job to expire checkout and release reservations
    const jobId = `checkout-expiry:${checkoutId}`;
    await this.redis.setex(
      jobId,
      1800, // 30 minutes
      JSON.stringify({ checkoutId, action: 'expire' }),
    );
  }
}
```

---

## 📱 Frontend Components

### Cart Component
```tsx
// src/components/cart/Cart.tsx
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

export function Cart() {
  const { t } = useTranslation();
  const { cart, summary, updateQuantity, removeItem, isLoading } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          {t('cart.empty')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('cart.emptyDescription')}
        </p>
        <div className="mt-6">
          <a
            href="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('cart.continueShopping')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 py-6">
          {t('cart.title')}
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <ul className="divide-y divide-gray-200">
              {cart.items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="py-6 flex">
                  <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                    <img
                      src={item.product.images[0]?.thumbnailUrl}
                      alt={item.product.name}
                      className="w-full h-full object-center object-cover"
                    />
                  </div>

                  <div className="ml-4 flex-1 flex flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>
                          <a href={`/products/${item.product.slug}`}>
                            {item.product.name}
                          </a>
                        </h3>
                        <p className="ml-4">
                          {formatCurrency(
                            item.price * item.quantity,
                            item.currency,
                            i18n.language,
                          )}
                        </p>
                      </div>
                      {item.variant.attributes && (
                        <p className="mt-1 text-sm text-gray-500">
                          {Object.entries(item.variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 flex items-end justify-between text-sm">
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              `${item.productId}-${item.variantId}`,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          disabled={
                            item.quantity <= 1 ||
                            updatingItems.has(`${item.productId}-${item.variantId}`)
                          }
                          className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="mx-3 font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              `${item.productId}-${item.variantId}`,
                              item.quantity + 1,
                            )
                          }
                          disabled={
                            updatingItems.has(`${item.productId}-${item.variantId}`)
                          }
                          className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(`${item.productId}-${item.variantId}`)
                        }
                        className="font-medium text-red-600 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50 rounded-lg px-6 py-6">
              <h2 className="text-lg font-medium text-gray-900">
                {t('cart.orderSummary')}
              </h2>
              
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">{t('cart.subtotal')}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.subtotal, summary.currency, i18n.language)}
                  </dd>
                </div>
                
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">{t('cart.tax')}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.tax, summary.currency, i18n.language)}
                  </dd>
                </div>
                
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">{t('cart.shipping')}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {summary.shipping === 0
                      ? t('cart.calculatedAtCheckout')
                      : formatCurrency(summary.shipping, summary.currency, i18n.language)}
                  </dd>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">
                    {t('cart.total')}
                  </dt>
                  <dd className="text-base font-medium text-gray-900">
                    {formatCurrency(summary.total, summary.currency, i18n.language)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <a
                  href="/checkout"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md shadow hover:bg-blue-700 flex justify-center items-center text-base font-medium"
                >
                  {t('cart.proceedToCheckout')}
                </a>
              </div>

              <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                <p>
                  {t('cart.or')}{' '}
                  <a
                    href="/products"
                    className="text-blue-600 font-medium hover:text-blue-500"
                  >
                    {t('cart.continueShopping')}
                    <span aria-hidden="true"> &rarr;</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Checkout Flow Component
```tsx
// src/components/checkout/CheckoutFlow.tsx
import { useState } from 'react';
import { useCheckout } from '@/hooks/useCheckout';
import { CheckoutSteps } from './CheckoutSteps';
import { ShippingForm } from './ShippingForm';
import { ShippingMethods } from './ShippingMethods';
import { PaymentForm } from './PaymentForm';
import { OrderReview } from './OrderReview';

const steps = [
  { id: 'shipping', name: 'Shipping' },
  { id: 'delivery', name: 'Delivery' },
  { id: 'payment', name: 'Payment' },
  { id: 'review', name: 'Review' },
];

export function CheckoutFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const { checkoutSession, updateShippingAddress, selectShippingMethod, completeCheckout } = useCheckout();

  const handleStepComplete = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <CheckoutSteps steps={steps} currentStep={currentStep} />
      
      <div className="mt-8">
        {currentStep === 0 && (
          <ShippingForm
            onSubmit={async (data) => {
              await updateShippingAddress(data);
              handleStepComplete();
            }}
          />
        )}
        
        {currentStep === 1 && (
          <ShippingMethods
            options={checkoutSession?.availableShippingMethods}
            selected={checkoutSession?.shippingMethod}
            onSelect={async (method) => {
              await selectShippingMethod(method.id);
              handleStepComplete();
            }}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 2 && (
          <PaymentForm
            onSubmit={async (paymentMethod) => {
              // Payment will be handled in next sprint
              handleStepComplete();
            }}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 3 && (
          <OrderReview
            checkoutSession={checkoutSession}
            onConfirm={async () => {
              await completeCheckout();
            }}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
```

---

## ✅ Sprint Checklist

### Backend
- [ ] Cart service with Redis
- [ ] Cart API endpoints
- [ ] Address management
- [ ] Checkout session handling
- [ ] Shipping calculation
- [ ] Inventory reservation
- [ ] Tax calculation

### Frontend
- [ ] Cart page
- [ ] Mini cart component
- [ ] Checkout flow
- [ ] Address forms
- [ ] Shipping selection
- [ ] Order summary

### Testing
- [ ] Cart operations tests
- [ ] Inventory reservation tests
- [ ] Checkout flow E2E test
- [ ] Guest checkout test

---

## 📈 Metrics

- Cart abandonment rate: < 70%
- Checkout completion rate: > 30%
- Average checkout time: < 3 minutes
- Inventory reservation success: > 99%

---

## 🔄 Next Sprint Preview

**Sprint 4: Orders Management**
- Order creation from checkout
- Order status management
- Order history
- Order details page
- Merchant order view

---

**Sprint 3 Complete: Ready to take orders! 🛒**