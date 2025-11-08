# Sprint 2: Product Catalog
## Marketplace Core (День 11-15)

**Dates:** 29 Января - 2 Февраля 2024  
**Goal:** Создать полнофункциональный каталог товаров/услуг/курсов  
**Team Focus:** Backend - 60%, Frontend - 40%  

---

## 🎯 Sprint Goals

1. **Product Management** - CRUD операции для товаров
2. **Categories & Attributes** - Гибкая система категорий
3. **Search & Filtering** - PostgreSQL full-text search
4. **Image Management** - Загрузка и оптимизация изображений
5. **Localization** - Мультиязычный контент

---

## 📋 User Stories

### CAT-001: Product Model & CRUD (8 SP)
**As a** merchant  
**I want** to create and manage products  
**So that** I can sell on the platform  

**Acceptance Criteria:**
- [ ] Create products (physical/digital/service)
- [ ] Product variants (size, color, etc.)
- [ ] SKU management
- [ ] Status management (draft/active/inactive)
- [ ] Bulk operations

**Database Schema:**
```sql
-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('physical', 'digital', 'service')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'deleted')),
    sku VARCHAR(100),
    base_price INTEGER NOT NULL, -- in minor units
    currency VARCHAR(3) NOT NULL,
    weight INTEGER, -- in grams for physical products
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_merchant_products (merchant_id, status),
    INDEX idx_product_type (type),
    UNIQUE(merchant_id, sku)
);

-- Product translations
CREATE TABLE product_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    meta_title VARCHAR(100),
    meta_description VARCHAR(160),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, locale),
    UNIQUE(locale, slug),
    INDEX idx_product_locale (product_id, locale),
    INDEX idx_slug (slug)
);

-- Product variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    compare_at_price INTEGER,
    cost INTEGER,
    inventory_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}', -- {color: "red", size: "M"}
    weight INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, sku),
    INDEX idx_variant_attributes (attributes)
);

-- Product images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_product_images (product_id, position)
);
```

**Backend Implementation:**
```typescript
// src/modules/catalog/entities/product.entity.ts
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, merchant => merchant.products)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ nullable: true })
  sku: string;

  @Column({ name: 'base_price' })
  basePrice: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  weight: number;

  @OneToMany(() => ProductTranslation, translation => translation.product, {
    cascade: true,
    eager: true,
  })
  translations: ProductTranslation[];

  @OneToMany(() => ProductVariant, variant => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, image => image.product, {
    cascade: true,
  })
  images: ProductImage[];

  @ManyToMany(() => Category, category => category.products)
  @JoinTable()
  categories: Category[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual field for localized content
  getTranslation(locale: string): ProductTranslation {
    const translation = this.translations.find(t => t.locale === locale);
    if (translation) return translation;
    
    // Fallback to English or first available
    return this.translations.find(t => t.locale === 'en') || this.translations[0];
  }
}

// src/modules/catalog/dto/create-product.dto.ts
export class CreateProductDto {
  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsString()
  @IsIn(['USD', 'RUB', 'AED'])
  currency: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations: ProductTranslationDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];
}

// src/modules/catalog/catalog.service.ts
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductTranslation)
    private translationRepository: Repository<ProductTranslation>,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly imageService: ImageService,
    private readonly cacheService: CacheService,
  ) {}

  async createProduct(
    merchantId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      merchant: { id: merchantId },
    });

    // Generate slug for each translation
    for (const translation of product.translations) {
      translation.slug = await this.generateUniqueSlug(translation.name, translation.locale);
    }

    // Handle variants
    if (createProductDto.variants?.length) {
      product.variants = createProductDto.variants.map(variant =>
        this.variantRepository.create(variant),
      );
    } else {
      // Create default variant
      product.variants = [
        this.variantRepository.create({
          sku: product.sku || this.generateSku(),
          price: product.basePrice,
          inventoryQuantity: 0,
        }),
      ];
    }

    const savedProduct = await this.productRepository.save(product);

    // Index in search
    await this.indexProduct(savedProduct);

    // Emit event
    await this.eventEmitter.emit('product.created', {
      productId: savedProduct.id,
      merchantId,
    });

    return savedProduct;
  }

  async updateProduct(
    merchantId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, merchant: { id: merchantId } },
      relations: ['translations', 'variants', 'images', 'categories'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update product fields
    Object.assign(product, updateProductDto);

    // Handle translations
    if (updateProductDto.translations) {
      // Update existing or create new translations
      for (const translationDto of updateProductDto.translations) {
        const existing = product.translations.find(
          t => t.locale === translationDto.locale,
        );

        if (existing) {
          Object.assign(existing, translationDto);
        } else {
          product.translations.push(
            this.translationRepository.create(translationDto),
          );
        }
      }
    }

    const updatedProduct = await this.productRepository.save(product);

    // Update search index
    await this.indexProduct(updatedProduct);

    // Invalidate cache
    await this.cacheService.del(`product:${productId}:*`);

    return updatedProduct;
  }

  private async generateUniqueSlug(name: string, locale: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    let slug = baseSlug;
    let counter = 0;

    while (await this.translationRepository.findOne({ where: { slug, locale } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private generateSku(): string {
    return `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
```

---

### CAT-002: Categories & Attributes (5 SP)
**As a** merchant  
**I want** to categorize my products  
**So that** customers can find them easily  

**Acceptance Criteria:**
- [ ] Hierarchical categories
- [ ] Category-specific attributes
- [ ] Multiple categories per product
- [ ] Category translations
- [ ] Dynamic filters based on category

**Implementation:**
```typescript
// src/modules/catalog/entities/category.entity.ts
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => Category, category => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @Column()
  slug: string;

  @Column({ default: 0 })
  position: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, AttributeDefinition>;

  @OneToMany(() => CategoryTranslation, translation => translation.category)
  translations: CategoryTranslation[];

  @ManyToMany(() => Product, product => product.categories)
  products: Product[];
}

// Category attributes configuration
interface AttributeDefinition {
  key: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  required: boolean;
  options?: string[]; // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  translations: Record<string, {
    label: string;
    description?: string;
    options?: Record<string, string>; // Translated options
  }>;
}

// Example category attributes for Electronics
const electronicsAttributes: Record<string, AttributeDefinition> = {
  brand: {
    key: 'brand',
    type: 'text',
    required: true,
    translations: {
      en: { label: 'Brand' },
      ru: { label: 'Бренд' },
      ar: { label: 'العلامة التجارية' },
    },
  },
  screenSize: {
    key: 'screenSize',
    type: 'number',
    required: false,
    validation: { min: 3, max: 100 },
    translations: {
      en: { label: 'Screen Size (inches)' },
      ru: { label: 'Размер экрана (дюймы)' },
      ar: { label: 'حجم الشاشة (بوصة)' },
    },
  },
  color: {
    key: 'color',
    type: 'multiselect',
    required: false,
    options: ['black', 'white', 'silver', 'gold', 'blue', 'red'],
    translations: {
      en: { 
        label: 'Color',
        options: {
          black: 'Black',
          white: 'White',
          silver: 'Silver',
          gold: 'Gold',
          blue: 'Blue',
          red: 'Red',
        },
      },
      ru: {
        label: 'Цвет',
        options: {
          black: 'Черный',
          white: 'Белый',
          silver: 'Серебряный',
          gold: 'Золотой',
          blue: 'Синий',
          red: 'Красный',
        },
      },
    },
  },
};

// src/modules/catalog/services/category.service.ts
@Injectable()
export class CategoryService {
  async getCategoryTree(locale: string = 'en'): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: { parent: null, isActive: true },
      relations: ['children', 'translations'],
      order: { position: 'ASC' },
    });

    return this.buildTree(categories, locale);
  }

  private buildTree(categories: Category[], locale: string): any[] {
    return categories.map(category => ({
      id: category.id,
      slug: category.slug,
      name: category.getTranslation(locale)?.name,
      children: category.children ? this.buildTree(category.children, locale) : [],
      attributes: this.translateAttributes(category.attributes, locale),
    }));
  }

  private translateAttributes(
    attributes: Record<string, AttributeDefinition>,
    locale: string,
  ): any[] {
    return Object.values(attributes).map(attr => ({
      key: attr.key,
      type: attr.type,
      required: attr.required,
      label: attr.translations[locale]?.label || attr.translations.en.label,
      options: attr.type === 'select' || attr.type === 'multiselect'
        ? attr.options?.map(opt => ({
            value: opt,
            label: attr.translations[locale]?.options?.[opt] || opt,
          }))
        : undefined,
    }));
  }
}
```

---

### CAT-003: Search & Filtering (8 SP)
**As a** customer  
**I want** to search and filter products  
**So that** I can find what I need  

**Acceptance Criteria:**
- [ ] Full-text search (PostgreSQL)
- [ ] Filter by price range
- [ ] Filter by categories
- [ ] Filter by attributes
- [ ] Sort options
- [ ] Search suggestions

**Implementation:**
```typescript
// Database indexes for search
CREATE INDEX idx_product_search ON product_translations 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_product_search_ru ON product_translations 
  USING gin(to_tsvector('russian', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_product_search_ar ON product_translations 
  USING gin(to_tsvector('arabic', name || ' ' || COALESCE(description, '')));

// src/modules/catalog/dto/search-products.dto.ts
export class SearchProductsDto {
  @IsOptional()
  @IsString()
  q?: string; // Search query

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'popular'])
  sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(['en', 'ru', 'ar'])
  locale?: string = 'en';
}

// src/modules/catalog/services/search.service.ts
@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
  ) {}

  async searchProducts(searchDto: SearchProductsDto): Promise<SearchResult> {
    // Cache key for results
    const cacheKey = `search:${JSON.stringify(searchDto)}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.merchant', 'merchant')
      .where('product.status = :status', { status: 'active' })
      .andWhere('translation.locale = :locale', { locale: searchDto.locale });

    // Full-text search
    if (searchDto.q) {
      const searchVector = this.getSearchVector(searchDto.locale);
      query.andWhere(
        `to_tsvector('${searchVector}', translation.name || ' ' || COALESCE(translation.description, '')) 
         @@ plainto_tsquery('${searchVector}', :query)`,
        { query: searchDto.q }
      );
    }

    // Category filter
    if (searchDto.categoryId) {
      query.andWhere('category.id = :categoryId', { 
        categoryId: searchDto.categoryId 
      });
    }

    // Price range filter
    if (searchDto.minPrice !== undefined) {
      query.andWhere('variant.price >= :minPrice', { 
        minPrice: searchDto.minPrice 
      });
    }

    if (searchDto.maxPrice !== undefined) {
      query.andWhere('variant.price <= :maxPrice', { 
        maxPrice: searchDto.maxPrice 
      });
    }

    // Attribute filters
    if (searchDto.attributes) {
      Object.entries(searchDto.attributes).forEach(([key, value], index) => {
        query.andWhere(`variant.attributes ->> :key${index} = :value${index}`, {
          [`key${index}`]: key,
          [`value${index}`]: value,
        });
      });
    }

    // Sorting
    switch (searchDto.sort) {
      case 'price_asc':
        query.orderBy('variant.price', 'ASC');
        break;
      case 'price_desc':
        query.orderBy('variant.price', 'DESC');
        break;
      case 'newest':
        query.orderBy('product.createdAt', 'DESC');
        break;
      case 'popular':
        // Assuming we have a popularity score
        query.orderBy('product.popularity', 'DESC');
        break;
      default:
        if (searchDto.q) {
          // Order by relevance for text search
          query.orderBy(
            `ts_rank(to_tsvector('${this.getSearchVector(searchDto.locale)}', 
             translation.name || ' ' || COALESCE(translation.description, '')), 
             plainto_tsquery('${this.getSearchVector(searchDto.locale)}', :query))`,
            'DESC'
          );
        } else {
          query.orderBy('product.createdAt', 'DESC');
        }
    }

    // Pagination
    query.skip(searchDto.offset).take(searchDto.limit);

    // Execute query
    const [products, total] = await query.getManyAndCount();

    // Get aggregations for filters
    const aggregations = await this.getAggregations(searchDto);

    const result = {
      products: products.map(p => this.mapProductToDto(p, searchDto.locale)),
      total,
      limit: searchDto.limit,
      offset: searchDto.offset,
      aggregations,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  private getSearchVector(locale: string): string {
    const vectors = {
      en: 'english',
      ru: 'russian',
      ar: 'arabic',
    };
    return vectors[locale] || 'english';
  }

  private async getAggregations(searchDto: SearchProductsDto) {
    // Get price range
    const priceRange = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.variants', 'variant')
      .select('MIN(variant.price)', 'min')
      .addSelect('MAX(variant.price)', 'max')
      .where('product.status = :status', { status: 'active' })
      .getRawOne();

    // Get category counts
    const categories = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .leftJoin('category.translations', 'catTrans')
      .select('category.id', 'id')
      .addSelect('catTrans.name', 'name')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.status = :status', { status: 'active' })
      .andWhere('catTrans.locale = :locale', { locale: searchDto.locale })
      .groupBy('category.id, catTrans.name')
      .getRawMany();

    return {
      priceRange,
      categories,
    };
  }

  async getSuggestions(query: string, locale: string): Promise<string[]> {
    const suggestions = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.translations', 'translation')
      .select('DISTINCT translation.name', 'name')
      .where('product.status = :status', { status: 'active' })
      .andWhere('translation.locale = :locale', { locale })
      .andWhere('translation.name ILIKE :query', { query: `%${query}%` })
      .limit(10)
      .getRawMany();

    return suggestions.map(s => s.name);
  }
}
```

---

### CAT-004: Image Management (5 SP)
**As a** merchant  
**I want** to upload product images  
**So that** customers can see my products  

**Acceptance Criteria:**
- [ ] Multiple images per product
- [ ] Image optimization
- [ ] CDN delivery
- [ ] Alt text for SEO
- [ ] Image variants (thumbnail, medium, large)

**Implementation:**
```typescript
// src/modules/catalog/services/image.service.ts
import * as sharp from 'sharp';
import { S3 } from 'aws-sdk';

@Injectable()
export class ImageService {
  private s3: S3;

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      endpoint: configService.get('AWS_ENDPOINT'),
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
      region: configService.get('AWS_REGION'),
    });
  }

  async uploadProductImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    const uploadedImages: ProductImage[] = [];

    for (const [index, file] of files.entries()) {
      // Validate image
      if (!this.isValidImage(file)) {
        throw new BadRequestException(`Invalid image format: ${file.originalname}`);
      }

      // Process image variants
      const variants = await this.processImageVariants(file.buffer);

      // Upload to S3
      const urls = await this.uploadVariantsToS3(productId, variants, file.originalname);

      // Save to database
      const productImage = await this.imageRepository.save({
        productId,
        url: urls.original,
        thumbnailUrl: urls.thumbnail,
        mediumUrl: urls.medium,
        largeUrl: urls.large,
        altText: '',
        position: index,
        width: variants.original.width,
        height: variants.original.height,
      });

      uploadedImages.push(productImage);
    }

    return uploadedImages;
  }

  private async processImageVariants(buffer: Buffer): Promise<ImageVariants> {
    const original = sharp(buffer);
    const metadata = await original.metadata();

    const variants = {
      original: {
        buffer: await original
          .jpeg({ quality: 90, progressive: true })
          .toBuffer(),
        width: metadata.width,
        height: metadata.height,
      },
      thumbnail: {
        buffer: await sharp(buffer)
          .resize(150, 150, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer(),
        width: 150,
        height: 150,
      },
      medium: {
        buffer: await sharp(buffer)
          .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer(),
        width: Math.min(500, metadata.width),
        height: Math.min(500, metadata.height),
      },
      large: {
        buffer: await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer(),
        width: Math.min(1200, metadata.width),
        height: Math.min(1200, metadata.height),
      },
    };

    return variants;
  }

  private async uploadVariantsToS3(
    productId: string,
    variants: ImageVariants,
    originalName: string,
  ): Promise<ImageUrls> {
    const timestamp = Date.now();
    const baseName = originalName.replace(/\.[^/.]+$/, '');

    const uploads = await Promise.all([
      this.uploadToS3(
        `products/${productId}/${timestamp}-${baseName}-original.jpg`,
        variants.original.buffer,
      ),
      this.uploadToS3(
        `products/${productId}/${timestamp}-${baseName}-thumb.jpg`,
        variants.thumbnail.buffer,
      ),
      this.uploadToS3(
        `products/${productId}/${timestamp}-${baseName}-medium.jpg`,
        variants.medium.buffer,
      ),
      this.uploadToS3(
        `products/${productId}/${timestamp}-${baseName}-large.jpg`,
        variants.large.buffer,
      ),
    ]);

    return {
      original: uploads[0],
      thumbnail: uploads[1],
      medium: uploads[2],
      large: uploads[3],
    };
  }

  private async uploadToS3(key: string, buffer: Buffer): Promise<string> {
    const result = await this.s3
      .upload({
        Bucket: this.configService.get('S3_BUCKET'),
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        CacheControl: 'public, max-age=31536000',
      })
      .promise();

    // Return CDN URL if configured, otherwise S3 URL
    const cdnUrl = this.configService.get('CDN_URL');
    return cdnUrl ? `${cdnUrl}/${key}` : result.Location;
  }

  private isValidImage(file: Express.Multer.File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.mimetype) && file.size <= 10 * 1024 * 1024; // 10MB
  }
}
```

---

## 📱 Frontend Components

### Product Card Component
```tsx
// src/components/catalog/ProductCard.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
  product: Product;
  locale: string;
  currency: string;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
}

export function ProductCard({
  product,
  locale,
  currency,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const translation = product.translations.find(t => t.locale === locale) ||
                     product.translations[0];

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite(product.id);
  };

  const price = formatCurrency(product.basePrice, currency, locale);
  const comparePrice = product.compareAtPrice
    ? formatCurrency(product.compareAtPrice, currency, locale)
    : null;

  const discount = comparePrice
    ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
          -{discount}%
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
        aria-label={t('catalog.toggleFavorite')}
      >
        {isFavorite ? (
          <HeartSolidIcon className="h-5 w-5 text-red-500" />
        ) : (
          <HeartIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Image */}
      <a href={`/products/${product.slug}`} className="block aspect-square overflow-hidden rounded-t-lg">
        {!imageError ? (
          <img
            src={product.images[0]?.mediumUrl || '/placeholder.jpg'}
            alt={product.images[0]?.altText || translation.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">{t('catalog.noImage')}</span>
          </div>
        )}
      </a>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
          <a href={`/products/${product.slug}`} className="hover:text-blue-600">
            {translation.name}
          </a>
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating) ? 'fill-current' : 'stroke-current'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">{price}</span>
            {comparePrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                {comparePrice}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <ShoppingCartIcon className="h-5 w-5" />
          <span>{t('catalog.addToCart')}</span>
        </button>
      </div>
    </div>
  );
}
```

---

## ✅ Sprint Checklist

### Backend Development
- [ ] Product CRUD endpoints
- [ ] Product variants system
- [ ] Category management
- [ ] Full-text search setup
- [ ] Image upload and processing
- [ ] Product translations

### Frontend Development
- [ ] Product listing page
- [ ] Product card component
- [ ] Search bar component
- [ ] Filter sidebar
- [ ] Category navigation

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for search
- [ ] Image upload tests
- [ ] Performance testing for search

### Documentation
- [ ] API documentation updated
- [ ] Search query examples
- [ ] Image upload guidelines

---

## 📈 Metrics

- Search response time: < 200ms
- Image upload success rate: > 99%
- Product creation time: < 5s
- Search relevance score: > 80%
- Test coverage: > 80%

---

## 🔄 Next Sprint Preview

**Sprint 3: Cart & Checkout**
- Shopping cart implementation
- Cart persistence
- Checkout flow
- Address management
- Shipping calculation

---

**Sprint 2 Complete: Product catalog ready for business! 📦**