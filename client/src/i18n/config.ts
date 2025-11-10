import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        services: 'Services',
        about: 'About',
        contact: 'Contact',
      },
      hero: {
        title: 'Welcome to SnailMarketplace',
        subtitle: 'A modern marketplace platform for physical goods, digital products, and professional services. Built for speed, security, and seamless user experience.',
        exploreBtn: 'Explore Services',
        getStartedBtn: 'Get Started',
      },
      services: {
        title: 'Our Services',
        subtitle: 'Three powerful product types to build your marketplace empire',
        physical: {
          title: 'Physical Goods',
          description: 'Sell and ship tangible products with integrated inventory management and order tracking.',
          features: [
            'Inventory Management',
            'Order Tracking',
            'Shipping Integration',
            'Multiple Currencies',
            'Multi-language Support',
          ],
        },
        digital: {
          title: 'Digital Products',
          description: 'Distribute digital content like ebooks, software, courses, and media files securely.',
          features: [
            'Instant Delivery',
            'Secure Downloads',
            'License Management',
            'Access Control',
            'Version Updates',
          ],
        },
        professional: {
          title: 'Professional Services',
          description: 'Book appointments and schedule professional services with integrated calendar management.',
          features: [
            'Appointment Booking',
            'Calendar Integration',
            'Automated Reminders',
            'Service Management',
            'Client Portal',
          ],
        },
      },
      footer: {
        description: 'A modern modular marketplace platform built with NestJS, PostgreSQL, Redis, and S3. Supporting physical goods, digital products, and professional services.',
        platform: 'Platform',
        support: 'Support',
        legal: 'Legal',
        connect: 'Connect',
        copyright: 'All rights reserved.',
      },
    },
  },
  ru: {
    translation: {
      nav: {
        home: 'Главная',
        services: 'Услуги',
        about: 'О нас',
        contact: 'Контакты',
      },
      hero: {
        title: 'Добро пожаловать в SnailMarketplace',
        subtitle: 'Современная платформа для маркетплейса физических товаров, цифровых продуктов и профессиональных услуг. Создано для скорости, безопасности и удобства пользователей.',
        exploreBtn: 'Изучить услуги',
        getStartedBtn: 'Начать',
      },
      services: {
        title: 'Наши услуги',
        subtitle: 'Три мощных типа продуктов для построения вашей маркетплейс империи',
        physical: {
          title: 'Физические товары',
          description: 'Продавайте и отправляйте материальные продукты с интегрированным управлением запасами и отслеживанием заказов.',
          features: [
            'Управление запасами',
            'Отслеживание заказов',
            'Интеграция доставки',
            'Множество валют',
            'Многоязычная поддержка',
          ],
        },
        digital: {
          title: 'Цифровые продукты',
          description: 'Распространяйте цифровой контент, такой как электронные книги, программное обеспечение, курсы и медиа-файлы безопасно.',
          features: [
            'Мгновенная доставка',
            'Безопасные загрузки',
            'Управление лицензиями',
            'Контроль доступа',
            'Обновления версий',
          ],
        },
        professional: {
          title: 'Профессиональные услуги',
          description: 'Бронируйте встречи и планируйте профессиональные услуги с интегрированным управлением календарем.',
          features: [
            'Бронирование встреч',
            'Интеграция календаря',
            'Автоматические напоминания',
            'Управление услугами',
            'Клиентский портал',
          ],
        },
      },
      footer: {
        description: 'Современная модульная платформа маркетплейса, созданная на NestJS, PostgreSQL, Redis и S3. Поддержка физических товаров, цифровых продуктов и профессиональных услуг.',
        platform: 'Платформа',
        support: 'Поддержка',
        legal: 'Правовая информация',
        connect: 'Связаться',
        copyright: 'Все права защищены.',
      },
    },
  },
  ar: {
    translation: {
      nav: {
        home: 'الرئيسية',
        services: 'الخدمات',
        about: 'عن',
        contact: 'اتصل',
      },
      hero: {
        title: 'مرحبًا بك في SnailMarketplace',
        subtitle: 'منصة سوق حديثة للسلع المادية والمنتجات الرقمية والخدمات المهنية. مبنية من أجل السرعة والأمان وتجربة مستخدم سلسة.',
        exploreBtn: 'استكشف الخدمات',
        getStartedBtn: 'ابدأ',
      },
      services: {
        title: 'خدماتنا',
        subtitle: 'ثلاثة أنواع قوية من المنتجات لبناء إمبراطورية السوق الخاصة بك',
        physical: {
          title: 'السلع المادية',
          description: 'بيع وشحن المنتجات الملموسة مع إدارة المخزون المتكاملة وتتبع الطلبات.',
          features: [
            'إدارة المخزون',
            'تتبع الطلبات',
            'تكامل الشحن',
            'عملات متعددة',
            'دعم متعدد اللغات',
          ],
        },
        digital: {
          title: 'المنتجات الرقمية',
          description: 'توزيع المحتوى الرقمي مثل الكتب الإلكترونية والبرامج والدورات والملفات الوسائط بشكل آمن.',
          features: [
            'التسليم الفوري',
            'التنزيلات الآمنة',
            'إدارة التراخيص',
            'التحكم في الوصول',
            'تحديثات الإصدار',
          ],
        },
        professional: {
          title: 'الخدمات المهنية',
          description: 'حجز المواعيد وجدولة الخدمات المهنية مع إدارة التقويم المتكاملة.',
          features: [
            'حجز المواعيد',
            'تكامل التقويم',
            'التذكيرات التلقائية',
            'إدارة الخدمة',
            'بوابة العملاء',
          ],
        },
      },
      footer: {
        description: 'منصة سوق نمطية حديثة مبنية على NestJS و PostgreSQL و Redis و S3. تدعم السلع المادية والمنتجات الرقمية والخدمات المهنية.',
        platform: 'المنصة',
        support: 'الدعم',
        legal: 'قانوني',
        connect: 'اتصل',
        copyright: 'كل الحقوق محفوظة.',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
