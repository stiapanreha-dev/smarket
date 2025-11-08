/* eslint-disable no-console */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserLocale,
  UserCurrency,
  UserRole,
  Merchant,
  KycStatus,
  PayoutMethod,
  MerchantStatus,
  Product,
  ProductType,
  ProductStatus,
  ProductVariant,
  InventoryPolicy,
  VariantStatus,
  ProductTranslation,
  TranslationLocale,
} from '../entities';

async function seed(dataSource: DataSource) {
  console.log('Starting seed...');

  // Disable RLS for seeding
  await dataSource.query(`SET app.is_admin = 'true';`);

  const userRepository = dataSource.getRepository(User);
  const merchantRepository = dataSource.getRepository(Merchant);
  const productRepository = dataSource.getRepository(Product);
  const variantRepository = dataSource.getRepository(ProductVariant);
  const translationRepository = dataSource.getRepository(ProductTranslation);

  // Create test users
  console.log('Creating users...');
  const password = await bcrypt.hash('Test123456!', 10);

  const merchant1User = userRepository.create({
    email: 'merchant1@snailmarket.com',
    password_hash: password,
    first_name: 'John',
    last_name: 'Smith',
    locale: UserLocale.EN,
    currency: UserCurrency.USD,
    role: UserRole.MERCHANT,
    email_verified: true,
  });
  await userRepository.save(merchant1User);

  const merchant2User = userRepository.create({
    email: 'merchant2@snailmarket.com',
    password_hash: password,
    first_name: 'Maria',
    last_name: 'Petrova',
    locale: UserLocale.RU,
    currency: UserCurrency.RUB,
    role: UserRole.MERCHANT,
    email_verified: true,
  });
  await userRepository.save(merchant2User);

  const buyerUser = userRepository.create({
    email: 'buyer@snailmarket.com',
    password_hash: password,
    first_name: 'Ahmed',
    last_name: 'Al-Mansoori',
    locale: UserLocale.AR,
    currency: UserCurrency.AED,
    role: UserRole.BUYER,
    email_verified: true,
  });
  await userRepository.save(buyerUser);

  // Create merchants
  console.log('Creating merchants...');
  const merchant1 = merchantRepository.create({
    owner_id: merchant1User.id,
    legal_name: 'Tech Gadgets Inc.',
    display_name: 'TechHub',
    description: 'Premium electronics and gadgets',
    website: 'https://techhub.example.com',
    kyc_status: KycStatus.APPROVED,
    kyc_verified_at: new Date(),
    payout_method: PayoutMethod.STRIPE,
    status: MerchantStatus.ACTIVE,
    business_address: {
      country: 'US',
      city: 'San Francisco',
      street: '123 Market St',
      postal_code: '94102',
      state: 'CA',
    },
    settings: {
      commission_rate: 0.15,
      auto_approve_products: true,
    },
  });
  await merchantRepository.save(merchant1);

  const merchant2 = merchantRepository.create({
    owner_id: merchant2User.id,
    legal_name: 'Online Education Services LLC',
    display_name: 'EduPro',
    description: 'Professional online courses and training',
    website: 'https://edupro.example.com',
    kyc_status: KycStatus.APPROVED,
    kyc_verified_at: new Date(),
    payout_method: PayoutMethod.BANK_TRANSFER,
    status: MerchantStatus.ACTIVE,
    business_address: {
      country: 'RU',
      city: 'Moscow',
      street: 'Tverskaya 10',
      postal_code: '125009',
    },
    settings: {
      commission_rate: 0.2,
      auto_approve_products: false,
    },
  });
  await merchantRepository.save(merchant2);

  // Create products
  console.log('Creating products...');
  const products = [];

  // Physical products from merchant1 (10 products)
  const physicalProducts = [
    {
      title: 'Wireless Bluetooth Headphones',
      description:
        'Premium wireless headphones with active noise cancellation and 30-hour battery life',
      type: ProductType.PHYSICAL,
      price: 9999,
      inventory: 50,
      attrs: {
        brand: 'AudioTech',
        color: 'Black',
        weight: 0.25,
        category: ['Electronics', 'Audio'],
      },
    },
    {
      title: 'Smart Watch Pro',
      description: 'Advanced fitness tracking and notifications on your wrist',
      type: ProductType.PHYSICAL,
      price: 29999,
      inventory: 30,
      attrs: {
        brand: 'TechWear',
        color: 'Silver',
        weight: 0.05,
        category: ['Electronics', 'Wearables'],
      },
    },
    {
      title: 'Portable Power Bank 20000mAh',
      description: 'High-capacity power bank with fast charging support',
      type: ProductType.PHYSICAL,
      price: 3999,
      inventory: 100,
      attrs: {
        brand: 'PowerMax',
        color: 'Blue',
        weight: 0.35,
        category: ['Electronics', 'Accessories'],
      },
    },
    {
      title: 'USB-C Hub 7-in-1',
      description: 'Expand your laptop connectivity with 7 ports including HDMI and USB 3.0',
      type: ProductType.PHYSICAL,
      price: 4999,
      inventory: 75,
      attrs: {
        brand: 'ConnectPlus',
        color: 'Gray',
        weight: 0.15,
        category: ['Electronics', 'Accessories'],
      },
    },
    {
      title: 'Mechanical Gaming Keyboard',
      description: 'RGB backlit mechanical keyboard with blue switches',
      type: ProductType.PHYSICAL,
      price: 12999,
      inventory: 40,
      attrs: {
        brand: 'GamePro',
        color: 'Black',
        weight: 1.2,
        category: ['Electronics', 'Gaming'],
      },
    },
    {
      title: 'Wireless Gaming Mouse',
      description: 'High-precision gaming mouse with 16000 DPI and customizable buttons',
      type: ProductType.PHYSICAL,
      price: 7999,
      inventory: 60,
      attrs: {
        brand: 'GamePro',
        color: 'Black',
        weight: 0.12,
        category: ['Electronics', 'Gaming'],
      },
    },
    {
      title: '4K Webcam',
      description: 'Professional 4K webcam with autofocus and built-in microphone',
      type: ProductType.PHYSICAL,
      price: 15999,
      inventory: 25,
      attrs: {
        brand: 'VisionTech',
        color: 'Black',
        weight: 0.3,
        category: ['Electronics', 'Video'],
      },
    },
    {
      title: 'Laptop Stand Aluminum',
      description: 'Ergonomic aluminum laptop stand with adjustable height',
      type: ProductType.PHYSICAL,
      price: 5999,
      inventory: 80,
      attrs: {
        brand: 'ErgoDesk',
        color: 'Silver',
        weight: 0.8,
        category: ['Office', 'Accessories'],
      },
    },
  ];

  for (const productData of physicalProducts) {
    const product = productRepository.create({
      merchant_id: merchant1.id,
      type: productData.type,
      title: productData.title,
      description: productData.description,
      status: ProductStatus.ACTIVE,
      attrs: productData.attrs,
      published_at: new Date(),
    });
    await productRepository.save(product);
    products.push(product);

    // Create variant
    const variant = variantRepository.create({
      product_id: product.id,
      sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      price_minor: productData.price,
      currency: 'USD',
      inventory_quantity: productData.inventory,
      inventory_policy: InventoryPolicy.DENY,
      status: VariantStatus.ACTIVE,
      attrs: productData.attrs,
    });
    await variantRepository.save(variant);

    // Create translations
    const enTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.EN,
      title: productData.title,
      description: productData.description,
    });
    await translationRepository.save(enTranslation);
  }

  // Digital products from merchant2 (7 courses)
  const digitalProducts = [
    {
      title: 'Complete Web Development Bootcamp',
      titleRu: 'Полный курс веб-разработки',
      titleAr: 'دورة تطوير الويب الكاملة',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch',
      descriptionRu: 'Изучите HTML, CSS, JavaScript, React, Node.js и MongoDB с нуля',
      descriptionAr: 'تعلم HTML و CSS و JavaScript و React و Node.js و MongoDB من الصفر',
      type: ProductType.COURSE,
      price: 4999,
      attrs: {
        duration: 40,
        level: 'Beginner',
        category: ['Programming', 'Web Development'],
      },
    },
    {
      title: 'Advanced Python Programming',
      titleRu: 'Продвинутое программирование на Python',
      titleAr: 'برمجة بايثون المتقدمة',
      description:
        'Master advanced Python concepts including decorators, generators, and async programming',
      descriptionRu:
        'Освойте продвинутые концепции Python: декораторы, генераторы, асинхронное программирование',
      descriptionAr:
        'أتقن مفاهيم بايثون المتقدمة بما في ذلك المزخرفات والمولدات والبرمجة غير المتزامنة',
      type: ProductType.COURSE,
      price: 5999,
      attrs: {
        duration: 30,
        level: 'Advanced',
        category: ['Programming', 'Python'],
      },
    },
    {
      title: 'Data Science with R',
      titleRu: 'Наука о данных с R',
      titleAr: 'علم البيانات مع R',
      description: 'Learn data analysis, visualization, and machine learning with R',
      descriptionRu: 'Изучите анализ данных, визуализацию и машинное обучение с R',
      descriptionAr: 'تعلم تحليل البيانات والتصور والتعلم الآلي باستخدام R',
      type: ProductType.COURSE,
      price: 6999,
      attrs: {
        duration: 35,
        level: 'Intermediate',
        category: ['Data Science', 'R'],
      },
    },
    {
      title: 'Digital Marketing Masterclass',
      titleRu: 'Мастер-класс по цифровому маркетингу',
      titleAr: 'دورة التسويق الرقمي الشاملة',
      description: 'Complete guide to SEO, social media, and content marketing',
      descriptionRu: 'Полное руководство по SEO, социальным сетям и контент-маркетингу',
      descriptionAr: 'دليل شامل لتحسين محركات البحث ووسائل التواصل الاجتماعي وتسويق المحتوى',
      type: ProductType.COURSE,
      price: 3999,
      attrs: {
        duration: 25,
        level: 'Beginner',
        category: ['Marketing', 'Digital Marketing'],
      },
    },
    {
      title: 'UI/UX Design Fundamentals',
      titleRu: 'Основы UI/UX дизайна',
      titleAr: 'أساسيات تصميم واجهة المستخدم وتجربة المستخدم',
      description: 'Learn design principles, prototyping, and user research',
      descriptionRu: 'Изучите принципы дизайна, прототипирование и исследование пользователей',
      descriptionAr: 'تعلم مبادئ التصميم والنماذج الأولية وأبحاث المستخدم',
      type: ProductType.COURSE,
      price: 4499,
      attrs: {
        duration: 28,
        level: 'Beginner',
        category: ['Design', 'UI/UX'],
      },
    },
  ];

  for (const productData of digitalProducts) {
    const product = productRepository.create({
      merchant_id: merchant2.id,
      type: productData.type,
      title: productData.title,
      description: productData.description,
      status: ProductStatus.ACTIVE,
      attrs: productData.attrs,
      published_at: new Date(),
    });
    await productRepository.save(product);
    products.push(product);

    // Create variant (digital products have unlimited inventory)
    const variant = variantRepository.create({
      product_id: product.id,
      sku: `COURSE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      price_minor: productData.price,
      currency: 'USD',
      inventory_quantity: 999999,
      inventory_policy: InventoryPolicy.CONTINUE,
      status: VariantStatus.ACTIVE,
      attrs: {
        access_duration: 365,
        ...productData.attrs,
      },
      requires_shipping: false,
    });
    await variantRepository.save(variant);

    // Create translations for all three languages
    const enTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.EN,
      title: productData.title,
      description: productData.description,
    });
    await translationRepository.save(enTranslation);

    const ruTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.RU,
      title: productData.titleRu,
      description: productData.descriptionRu,
    });
    await translationRepository.save(ruTranslation);

    const arTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.AR,
      title: productData.titleAr,
      description: productData.descriptionAr,
    });
    await translationRepository.save(arTranslation);
  }

  // Service products from merchant1 (5 services)
  const serviceProducts = [
    {
      title: 'Laptop Repair Service',
      titleRu: 'Ремонт ноутбуков',
      titleAr: 'خدمة إصلاح أجهزة الكمبيوتر المحمولة',
      description: 'Professional laptop repair and maintenance service',
      descriptionRu: 'Профессиональный ремонт и обслуживание ноутбуков',
      descriptionAr: 'خدمة إصلاح وصيانة احترافية لأجهزة الكمبيوتر المحمولة',
      type: ProductType.SERVICE,
      price: 7999,
      attrs: {
        duration: 120,
        category: ['Electronics', 'Repair'],
      },
    },
    {
      title: 'Phone Screen Replacement',
      titleRu: 'Замена экрана телефона',
      titleAr: 'استبدال شاشة الهاتف',
      description: 'Quick phone screen replacement service',
      descriptionRu: 'Быстрая замена экрана телефона',
      descriptionAr: 'خدمة سريعة لاستبدال شاشة الهاتف',
      type: ProductType.SERVICE,
      price: 4999,
      attrs: {
        duration: 60,
        category: ['Electronics', 'Repair'],
      },
    },
    {
      title: 'Data Recovery Service',
      titleRu: 'Восстановление данных',
      titleAr: 'خدمة استعادة البيانات',
      description: 'Professional data recovery from damaged devices',
      descriptionRu: 'Профессиональное восстановление данных с поврежденных устройств',
      descriptionAr: 'استعادة احترافية للبيانات من الأجهزة التالفة',
      type: ProductType.SERVICE,
      price: 19999,
      attrs: {
        duration: 240,
        category: ['Electronics', 'Data'],
      },
    },
  ];

  for (const productData of serviceProducts) {
    const product = productRepository.create({
      merchant_id: merchant1.id,
      type: productData.type,
      title: productData.title,
      description: productData.description,
      status: ProductStatus.ACTIVE,
      attrs: productData.attrs,
      published_at: new Date(),
    });
    await productRepository.save(product);
    products.push(product);

    // Create variant
    const variant = variantRepository.create({
      product_id: product.id,
      sku: `SERVICE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      price_minor: productData.price,
      currency: 'USD',
      inventory_quantity: 10,
      inventory_policy: InventoryPolicy.TRACK,
      status: VariantStatus.ACTIVE,
      attrs: productData.attrs,
      requires_shipping: false,
    });
    await variantRepository.save(variant);

    // Create translations
    const enTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.EN,
      title: productData.title,
      description: productData.description,
    });
    await translationRepository.save(enTranslation);

    const ruTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.RU,
      title: productData.titleRu,
      description: productData.descriptionRu,
    });
    await translationRepository.save(ruTranslation);

    const arTranslation = translationRepository.create({
      product_id: product.id,
      locale: TranslationLocale.AR,
      title: productData.titleAr,
      description: productData.descriptionAr,
    });
    await translationRepository.save(arTranslation);
  }

  console.log('Seed completed successfully!');
  console.log(`Created ${products.length} products across 2 merchants`);
}

export default seed;
