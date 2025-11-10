# Frontend Implementation Prompts

Этот документ содержит готовые промпты для поэтапной реализации фронтенда SnailMarketplace.

---

## Фаза 1: Инфраструктура и основа

### Промпт 1.1: Создание структуры проекта

```
Создай структуру папок для фронтенд приложения SnailMarketplace в директории client/src/:

Требуемая структура:
- api/ - API клиенты для каждого модуля бэкенда
- components/common/ - переиспользуемые UI компоненты
- components/layout/ - Layout компоненты (уже есть Navbar, Footer)
- components/features/ - специфичные компоненты для бизнес-логики
- store/ - Zustand stores
- hooks/ - Custom React hooks
- types/ - TypeScript типы и интерфейсы
- utils/ - утилиты и хелперы
- routes/ - конфигурация роутинга
- constants/ - константы приложения

Создай index.ts файлы для удобного импорта где это необходимо.
```

### Промпт 1.2: Настройка API клиента

```
Настрой Axios instance с interceptors для работы с бэкенд API SnailMarketplace:

Требования:
1. Создай файл client/src/api/axios.config.ts с настроенным Axios instance
2. Base URL из env переменной (VITE_API_URL)
3. Request interceptor для добавления JWT токена из localStorage
4. Response interceptor для обработки ошибок (401, 403, 500)
5. Automatic token refresh при 401 ошибке
6. Типизированные error responses

Backend API: http://localhost:3000/api/v1
Auth endpoint: /auth/login, /auth/refresh
```

### Промпт 1.3: Базовые UI компоненты

```
Создай набор базовых UI компонентов в client/src/components/common/ используя react-bootstrap:

Компоненты:
1. Button - кастомная обертка над react-bootstrap Button с дополнительными вариантами
2. Input - форм инпут с label, error message, иконкой
3. Card - переиспользуемая карточка для продуктов/сервисов
4. Modal - модальное окно
5. LoadingSpinner - индикатор загрузки
6. Alert - уведомления/алерты
7. Badge - бейджи для статусов

Каждый компонент должен:
- Быть полностью типизирован (TypeScript)
- Поддерживать все Bootstrap варианты
- Иметь props для кастомизации
- Экспортироваться через index.ts
```

### Промпт 1.4: Настройка React Router

```
Настрой React Router v6 для приложения SnailMarketplace:

Требования:
1. Создай файл client/src/routes/index.tsx с конфигурацией маршрутов
2. Используй createBrowserRouter и RouterProvider
3. Создай компонент ProtectedRoute для защищенных маршрутов
4. Создай Layout компоненты: MainLayout, AuthLayout, DashboardLayout

Маршруты MVP:
- / - Landing page (публичная)
- /auth/login - Login page
- /auth/register - Register page
- /catalog - Catalog page (публичная)
- /catalog/:id - Product details (публичная)
- /cart - Cart page
- /checkout - Checkout (защищенная)
- /orders - Orders list (защищенная)
- /orders/:id - Order details (защищенная)
- /profile - User profile (защищенная)
- /merchant/* - Merchant dashboard (защищенная, role-based)

Добавь 404 страницу и error boundary.
```

---

## Фаза 2: Аутентификация

### Промпт 2.1: Auth Store с Zustand

```
Создай auth store используя Zustand для управления аутентификацией:

Требования:
1. Файл: client/src/store/authStore.ts
2. Состояние: user, token, isAuthenticated, isLoading
3. Методы:
   - login(email, password)
   - register(userData)
   - logout()
   - refreshToken()
   - setUser(user)
4. Persist токен и user в localStorage
5. Интеграция с API (используй axios.config.ts)
6. Типизация User interface (id, email, first_name, last_name, role, locale, currency)

Backend endpoints:
- POST /auth/login - { email, password } -> { access_token, user }
- POST /auth/register - { email, password, first_name, last_name }
- POST /auth/refresh - { refresh_token } -> { access_token }
- GET /auth/me -> { user }
```

### Промпт 2.2: Login Page

```
Создай страницу логина client/src/pages/Auth/Login.tsx:

Требования:
1. Используй React Hook Form + Yup для валидации
2. Поля: email, password, "Remember me" checkbox
3. Кнопка "Login" с loading состоянием
4. Ссылка "Forgot password?" и "Don't have account? Register"
5. Error handling (показывать ошибки от API)
6. Редирект на /catalog после успешного входа
7. Используй authStore для логина
8. Адаптивная верстка (Bootstrap grid)
9. Поддержка i18n (en/ru/ar)

Дизайн: минималистичный, centered card на странице
```

### Промпт 2.3: Register Page

```
Создай страницу регистрации client/src/pages/Auth/Register.tsx:

Требования:
1. Форма с полями: email, password, confirm_password, first_name, last_name
2. Валидация:
   - Email формат
   - Password min 8 символов, 1 uppercase, 1 число
   - Passwords match
   - Required fields
3. Terms & conditions checkbox (required)
4. Language selector (EN/RU/AR)
5. Currency selector (USD/EUR/RUB)
6. Кнопка "Create Account" с loading
7. После регистрации - автоматический логин и редирект
8. Ссылка "Already have account? Login"
9. Используй authStore.register()

Backend: POST /auth/register
```

### Промпт 2.4: Protected Route Component

```
Создай компонент ProtectedRoute для защиты маршрутов:

Требования:
1. Файл: client/src/components/ProtectedRoute.tsx
2. Проверка isAuthenticated из authStore
3. Если не авторизован - редирект на /auth/login с returnUrl
4. Опциональная проверка role (для merchant routes)
5. Loading состояние пока проверяется токен
6. Интеграция с React Router

Использование:
<Route element={<ProtectedRoute />}>
  <Route path="/orders" element={<OrdersPage />} />
</Route>

<Route element={<ProtectedRoute requiredRole="merchant" />}>
  <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
</Route>
```

---

## Фаза 3: Каталог продуктов

### Промпт 3.1: TypeScript типы для Catalog

```
Создай TypeScript типы для модуля каталога в client/src/types/catalog.ts:

На основе backend entities создай интерфейсы:

1. Product:
   - id, name, description, price, currency
   - product_type: 'physical' | 'digital' | 'service'
   - images: string[]
   - category_id, merchant_id
   - stock (для physical)
   - file_url, file_size (для digital)
   - duration, location (для service)
   - created_at, updated_at

2. Category:
   - id, name, description, slug, parent_id

3. ProductFilters:
   - category_id, product_type, min_price, max_price
   - search, sort_by, order

4. PaginatedProducts:
   - data: Product[], total, page, limit, pages

Backend endpoints для справки:
- GET /catalog/products
- GET /catalog/products/:id
- GET /catalog/categories
```

### Промпт 3.2: Catalog API Client

```
Создай API клиент для каталога client/src/api/catalog.api.ts:

Требования:
1. Используй axios instance из axios.config.ts
2. Используй React Query для кэширования

Методы:
- getProducts(filters: ProductFilters) -> PaginatedProducts
- getProduct(id: string) -> Product
- getCategories() -> Category[]
- searchProducts(query: string, filters?) -> PaginatedProducts

Настрой React Query hooks:
- useProducts(filters)
- useProduct(id)
- useCategories()
- useSearchProducts(query)

Cache стратегии:
- Products list: staleTime 5 min
- Product details: staleTime 10 min
- Categories: staleTime 30 min
```

### Промпт 3.3: Product Card Component

```
Создай компонент карточки продукта client/src/components/features/ProductCard.tsx:

Требования:
1. Props: product: Product, variant?: 'grid' | 'list'
2. Отображение:
   - Image (первое из images array) с fallback
   - Product name (truncate если длинное)
   - Price с форматированием валюты
   - Product type badge (Physical/Digital/Service)
   - Rating (если есть)
   - "Add to Cart" button / "Book Now" для services
3. Hover эффекты
4. Клик на карточку - переход на /catalog/:id
5. Адаптивность (Bootstrap Card)
6. Поддержка RTL для арабского

Используй react-bootstrap Card, Badge, Button
```

### Промпт 3.4: Catalog Page

```
Создай страницу каталога client/src/pages/Catalog/CatalogPage.tsx:

Требования:
1. Layout: sidebar с фильтрами + main content с продуктами
2. Фильтры:
   - Categories (список с чекбоксами)
   - Product Type (Physical/Digital/Service)
   - Price range (min-max слайдер или inputs)
   - Search bar
3. Сортировка: dropdown (Price: Low to High, High to Low, Newest, Popular)
4. View toggle: Grid / List view
5. Products grid используя ProductCard
6. Pagination внизу
7. Loading states (skeleton loaders)
8. Empty state если нет продуктов
9. Используй useProducts hook с фильтрами
10. URL query params для фильтров (можно шарить ссылку)

Responsive: на мобилке фильтры в drawer/offcanvas
```

### Промпт 3.5: Product Details Page

```
Создай страницу детального просмотра продукта client/src/pages/Catalog/ProductPage.tsx:

Требования:
1. Route: /catalog/:id
2. Layout: 2 колонки (изображения слева, info справа)
3. Секции:
   - Image gallery (главное фото + thumbnails)
   - Product name, price, rating
   - Product type badge
   - Description (full text)
   - Specifications/Features (если есть)
   - Stock info для physical
   - Seller info (merchant name, rating)
   - Quantity selector + Add to Cart button
   - Buy Now button (быстрый checkout)
4. Для Digital: показать file size, format, "Instant delivery" badge
5. Для Service: показать duration, location, "Book Now" button
6. Tabs: Description, Specifications, Reviews (заглушка)
7. Related products carousel внизу
8. Используй useProduct(id) hook
9. Breadcrumbs: Home > Category > Product name
10. Loading skeleton для всей страницы

Используй react-bootstrap: Row, Col, Tabs, Button, Image
```

---

## Фаза 4: Корзина

### Промпт 4.1: Cart Store

```
Создай store для корзины client/src/store/cartStore.ts:

Требования:
1. Состояние:
   - items: CartItem[] (product, quantity, selected_options)
   - total: number
   - itemsCount: number
   - isLoading: boolean
2. Методы:
   - addItem(product, quantity)
   - removeItem(itemId)
   - updateQuantity(itemId, quantity)
   - clearCart()
   - loadCart() - загрузка из API
   - syncWithBackend() - синхронизация
3. Persist в localStorage
4. Интеграция с backend API /cart

CartItem interface:
- id, product_id, product (populated), quantity, unit_price, total_price

Backend endpoints:
- GET /cart - получить корзину
- POST /cart/items - добавить товар
- PATCH /cart/items/:id - обновить количество
- DELETE /cart/items/:id - удалить товар
- DELETE /cart - очистить корзину
```

### Промпт 4.2: Cart Page

```
Создай страницу корзины client/src/pages/Cart/CartPage.tsx:

Требования:
1. Layout: список товаров + summary sidebar
2. Cart items:
   - Product image, name, price
   - Quantity controls (+/- buttons)
   - Remove button (иконка)
   - Subtotal per item
   - Stock warning если quantity > available
3. Summary section:
   - Subtotal
   - Shipping (calculated later)
   - Tax (calculated later)
   - Total
   - Promo code input + Apply button
   - "Proceed to Checkout" button
4. Empty state: "Your cart is empty" + "Continue Shopping" button
5. "Continue Shopping" link вверху
6. Используй cartStore
7. Real-time total calculation
8. Loading states на все операции
9. Confirmation modal при удалении товара

Responsive: на мобилке summary в bottom sheet или внизу
```

### Промпт 4.3: Cart Badge в Navbar

```
Обнови компонент Navbar для отображения количества товаров в корзине:

Требования:
1. Файл: client/src/components/layout/Navbar.tsx
2. Добавь Cart icon (из react-icons/bs: BsCart)
3. Badge с количеством товаров (cartStore.itemsCount)
4. Badge показывается только если items > 0
5. Клик на cart icon - переход на /cart
6. Анимация при добавлении товара (опционально)
7. Используй cartStore.itemsCount из Zustand

Дизайн: cart icon + badge (красный кружок с цифрой)
```

### Промпт 4.4: Add to Cart функционал

```
Добавь функционал "Add to Cart" на страницу ProductPage:

Требования:
1. Quantity selector (-, input, +) перед кнопкой
2. Min quantity: 1, Max: available stock (для physical)
3. "Add to Cart" button:
   - Disabled если out of stock
   - Loading состояние при добавлении
   - Success feedback (toast notification "Added to cart!")
   - Обновление cart badge
4. Для Digital products: quantity всегда 1 (скрыть selector)
5. Для Services: "Book Now" вместо "Add to Cart" (редирект на booking flow)
6. Валидация:
   - Не добавлять если quantity > stock
   - Проверка авторизации (если надо)
7. Используй cartStore.addItem()
8. Опционально: "Buy Now" button (Add to Cart + редирект на Checkout)

Используй react-hot-toast для уведомлений
```

---

## Фаза 5: Checkout

### Промпт 5.1: Checkout Store

```
Создай store для процесса checkout client/src/store/checkoutStore.ts:

Требования:
1. Multi-step checkout state:
   - currentStep: number (1-4)
   - shippingAddress: Address | null
   - deliveryMethod: DeliveryOption | null
   - paymentMethod: PaymentMethod | null
   - sessionId: string | null
2. Методы:
   - createSession() - создать checkout session в backend
   - setShippingAddress(address)
   - setDeliveryMethod(method)
   - setPaymentMethod(method)
   - nextStep() / previousStep()
   - completeCheckout() - финальная отправка заказа
3. Интеграция с backend /checkout endpoints
4. Валидация перед переходом на следующий шаг

Backend endpoints:
- POST /checkout/session - создать сессию из корзины
- PATCH /checkout/session/:id/shipping
- PATCH /checkout/session/:id/delivery
- POST /checkout/session/:id/complete -> создает Order
```

### Промпт 5.2: Checkout Page - Step 1 Shipping

```
Создай мультишаговый Checkout - Step 1: Shipping Address:

Файл: client/src/pages/Checkout/CheckoutPage.tsx

Требования:
1. Layout: stepper indicator вверху (1. Shipping → 2. Delivery → 3. Payment → 4. Review)
2. Active step: 1 - Shipping
3. Форма адреса доставки:
   - Full name, Phone
   - Address line 1, Address line 2
   - City, State/Province, Postal code, Country
4. "Save to my addresses" checkbox
5. Если есть сохраненные адреса - показать их списком (выбрать или добавить новый)
6. Валидация всех полей (required, formats)
7. Кнопки: "Back to Cart" | "Continue to Delivery"
8. Используй checkoutStore
9. Для Digital products - skip shipping step

Используй React Hook Form + Yup валидацию
```

### Промпт 5.3: Checkout Page - Step 2 Delivery

```
Создай Step 2: Delivery Method для Checkout:

Требования:
1. Stepper: активный шаг 2
2. Delivery options:
   - Standard Shipping (5-7 days) - $5.99
   - Express Shipping (2-3 days) - $12.99
   - Pickup from store - Free
3. Radio buttons для выбора метода
4. Estimated delivery date для каждого метода
5. Описание каждого метода
6. Кнопки: "Back" | "Continue to Payment"
7. Сохранить выбор в checkoutStore
8. Для Digital - skip этот step

Backend может возвращать доступные delivery options:
GET /checkout/session/:id/delivery-options
```

### Промпт 5.4: Checkout Page - Step 3 Payment

```
Создай Step 3: Payment Method для Checkout:

Требования:
1. Stepper: активный шаг 3
2. Payment options:
   - Credit/Debit Card (Stripe)
   - PayPal (future)
3. Card form (Stripe Elements):
   - Card number
   - Expiry date
   - CVC
   - Cardholder name
4. "Save card for future purchases" checkbox
5. Security badges (SSL, PCI compliant icons)
6. Кнопки: "Back" | "Review Order"
7. Валидация card данных (Stripe validation)
8. Сохранить payment method в checkoutStore (не сами card данные!)

Используй @stripe/react-stripe-js для card input
Backend: POST /checkout/session/:id/payment-intent
```

### Промпт 5.5: Checkout Page - Step 4 Review & Confirm

```
Создай Step 4: Review & Confirm для Checkout:

Требования:
1. Stepper: активный шаг 4
2. Order summary:
   - Shipping address (с кнопкой Edit - вернуться на Step 1)
   - Delivery method (с кнопкой Edit)
   - Payment method (последние 4 цифры карты)
   - Order items (из корзины): product, quantity, price
3. Pricing breakdown:
   - Subtotal
   - Shipping cost
   - Tax
   - Total
4. Terms & Conditions checkbox (required)
5. "Place Order" button:
   - Loading состояние
   - Disabled если не согласился с terms
6. После успешного заказа:
   - Вызвать checkoutStore.completeCheckout()
   - Очистить корзину
   - Редирект на /orders/:orderId с success message

Backend: POST /checkout/session/:id/complete
Response: { order_id, order_number, status }
```

---

## Фаза 6: Orders

### Промпт 6.1: Orders API & Types

```
Создай API клиент и типы для модуля заказов:

Файлы:
- client/src/types/order.ts - типы
- client/src/api/order.api.ts - API клиент

Types:
1. Order:
   - id, order_number, user_id, merchant_id
   - status, total_amount, currency
   - line_items: OrderLineItem[]
   - shipping_address, delivery_method
   - created_at, updated_at

2. OrderLineItem:
   - id, order_id, product_id, product (populated)
   - quantity, unit_price, total_price
   - status (для FSM)
   - product_type

3. OrderStatus (enum):
   - PENDING, PAYMENT_CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED
   - ACCESS_GRANTED, DOWNLOADED, REFUNDED (digital)
   - BOOKING_CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW (service)

API methods:
- getOrders(filters?) -> Order[]
- getOrder(id) -> Order with line_items
- cancelOrder(id) -> Order

React Query hooks:
- useOrders(filters)
- useOrder(id)
- useCancelOrder()

Backend: GET /orders, GET /orders/:id, POST /orders/:id/cancel
```

### Промпт 6.2: Orders List Page

```
Создай страницу списка заказов client/src/pages/Orders/OrdersPage.tsx:

Требования:
1. Заголовок "My Orders"
2. Tabs для фильтрации:
   - All, Active (pending, preparing, shipped), Completed, Cancelled
3. Order cards:
   - Order number, date
   - Status badge (цвет по статусу)
   - Thumbnails товаров (3 max, остальные +N)
   - Total amount
   - "View Details" button
4. Пагинация если много заказов
5. Empty state: "No orders yet" + "Start Shopping" button
6. Loading skeleton
7. Сортировка: Newest first
8. Используй useOrders() hook
9. Клик на order card - переход на /orders/:id

Дизайн: список карточек, каждая order = Card
```

### Промпт 6.3: Order Details Page

```
Создай страницу деталей заказа client/src/pages/Orders/OrderDetailsPage.tsx:

Требования:
1. Route: /orders/:id
2. Breadcrumbs: Home > My Orders > Order #12345
3. Секции:
   a) Order Header:
      - Order number, Order date
      - Status badge (большой, цветной)
      - "Cancel Order" button (если можно)

   b) Order Timeline (FSM states):
      - Vertical stepper с историей статусов
      - Pending → Payment Confirmed → Preparing → Shipped → Delivered
      - Даты для каждого статуса
      - Tracking number (если shipped)

   c) Line Items:
      - Таблица/список с товарами
      - Product image, name, quantity, price
      - Status каждого line item (может отличаться)
      - Для Digital: "Download" button если ACCESS_GRANTED
      - Для Service: Booking details (date, time, location)

   d) Shipping & Payment Info:
      - Shipping address
      - Delivery method
      - Payment method (last 4 digits)

   e) Pricing Summary:
      - Subtotal, Shipping, Tax, Total

   f) Actions:
      - "Download Invoice" button
      - "Contact Support" button
      - "Reorder" button

4. Используй useOrder(id) hook
5. Confirmation modal для Cancel Order

Responsive: на мобилке стек layout
```

### Промпт 6.4: Order Status Badge Component

```
Создай компонент для отображения статуса заказа:

Файл: client/src/components/features/OrderStatusBadge.tsx

Требования:
1. Props: status: OrderStatus, size?: 'sm' | 'md' | 'lg'
2. Цветовая схема по статусу:
   - PENDING: warning (yellow)
   - PAYMENT_CONFIRMED: info (blue)
   - PREPARING, IN_PROGRESS: primary (blue)
   - SHIPPED, READY_TO_SHIP: info (cyan)
   - DELIVERED, COMPLETED: success (green)
   - CANCELLED, REFUNDED: secondary (gray)
   - NO_SHOW: danger (red)
3. Human-readable текст (i18n):
   - PENDING -> "Pending"
   - PAYMENT_CONFIRMED -> "Payment Confirmed"
   - и т.д.
4. Иконки для каждого статуса (опционально)
5. Используй react-bootstrap Badge

Используй в OrderCard, OrderDetailsPage, MerchantOrdersList
```

---

## Фаза 7: User Profile

### Промпт 7.1: Profile Page

```
Создай страницу профиля пользователя client/src/pages/Profile/ProfilePage.tsx:

Требования:
1. Layout: sidebar с навигацией + main content
2. Sidebar menu:
   - Personal Information
   - Addresses
   - Payment Methods
   - Settings
   - Security
3. Personal Information section:
   - Avatar (upload, crop, preview)
   - First name, Last name, Email (readonly)
   - Phone
   - Date of birth
   - "Save Changes" button
4. Edit mode toggle или всегда editable
5. Валидация форм
6. Success toast после сохранения
7. Используй authStore.user для данных
8. API: PATCH /users/me - обновить профиль

Используй React Hook Form для управления формой
```

### Промпт 7.2: Settings Page

```
Создай страницу настроек client/src/pages/Profile/SettingsPage.tsx:

Требования:
1. Секции:
   a) Language & Region:
      - Language selector (EN/RU/AR dropdown)
      - Currency selector (USD/EUR/RUB)
      - Timezone (опционально)

   b) Notifications:
      - Email notifications toggle
      - Order updates checkbox
      - Promotions checkbox
      - Newsletter checkbox

   c) Privacy:
      - Profile visibility (public/private)
      - Show email (yes/no)
      - Show phone (yes/no)

2. "Save Settings" button внизу
3. Changes persist в backend: PATCH /users/me/settings
4. После смены языка - обновить i18n без reload
5. После смены валюты - обновить цены на странице

Используй react-bootstrap Form.Switch для toggles
```

### Промпт 7.3: Change Password

```
Создай форму смены пароля client/src/pages/Profile/ChangePasswordPage.tsx:

Требования:
1. Форма:
   - Current password (type=password)
   - New password (type=password)
   - Confirm new password
2. Валидация:
   - Current password required
   - New password: min 8 chars, 1 uppercase, 1 number, 1 special
   - Passwords match
   - New password != current password
3. Password strength indicator (weak/medium/strong)
4. Show/hide password toggle (иконка глаза)
5. "Change Password" button
6. Success: показать toast, очистить форму
7. Error handling: "Current password incorrect"
8. API: POST /auth/change-password

Используй React Hook Form + Yup
```

### Промпт 7.4: Saved Addresses

```
Создай страницу управления адресами client/src/pages/Profile/AddressesPage.tsx:

Требования:
1. Список сохраненных адресов (cards)
2. Каждый address card:
   - Full name, Phone
   - Address lines, City, Postal code, Country
   - "Default" badge если это default address
   - Actions: Edit, Delete, Set as Default
3. "Add New Address" button вверху
4. Add/Edit Address modal:
   - Форма адреса (такая же как в Checkout)
   - "Set as default" checkbox
   - Save button
5. Delete confirmation modal
6. API:
   - GET /users/me/addresses
   - POST /users/me/addresses
   - PATCH /users/me/addresses/:id
   - DELETE /users/me/addresses/:id
   - POST /users/me/addresses/:id/set-default

Empty state: "No addresses saved"
```

---

## Фаза 8: Merchant Dashboard

### Промпт 8.1: Merchant Dashboard Page

```
Создай главную страницу панели продавца client/src/pages/Merchant/DashboardPage.tsx:

Требования:
1. Protected route с проверкой role === "merchant"
2. Dashboard layout:
   - Sidebar navigation
   - Main content area
3. Statistics cards (KPIs):
   - Total Revenue (за месяц)
   - Total Orders (pending, completed)
   - Total Products
   - Average Rating
4. Charts:
   - Revenue chart (line chart, last 7 days)
   - Orders by status (pie chart)
   - Top selling products (bar chart)
5. Recent Orders table (last 10):
   - Order number, Customer, Total, Status, Date
   - Quick actions: View, Update status
6. API: GET /merchant/dashboard/stats

Используй recharts для графиков
```

### Промпт 8.2: Merchant Products Page

```
Создай страницу управления товарами продавца client/src/pages/Merchant/ProductsPage.tsx:

Требования:
1. Заголовок "My Products" + "Add New Product" button
2. Filters:
   - Product type (All/Physical/Digital/Service)
   - Status (Active/Inactive/Out of Stock)
   - Search by name
3. Products table:
   - Columns: Image, Name, Type, Price, Stock, Status, Actions
   - Actions: Edit, Delete, Duplicate, Toggle Active/Inactive
4. Bulk actions: Select all, Activate/Deactivate selected
5. Pagination
6. Empty state: "No products yet" + "Create your first product"
7. Delete confirmation modal
8. API:
   - GET /merchant/products
   - DELETE /merchant/products/:id
   - PATCH /merchant/products/:id/toggle-status

Используй react-bootstrap Table
```

### Промпт 8.3: Add/Edit Product Page

```
Создай страницу создания/редактирования продукта client/src/pages/Merchant/ProductFormPage.tsx:

Требования:
1. Multi-step form или tabs:
   - Basic Information
   - Images
   - Pricing & Inventory
   - Shipping (для physical)
   - SEO

2. Basic Information:
   - Product name (required)
   - Description (textarea, wysiwyg editor опционально)
   - Category (select)
   - Product type (radio: Physical/Digital/Service)
   - Tags (multi-select или comma-separated)

3. Images:
   - Upload multiple images (drag & drop)
   - Preview thumbnails
   - Reorder images (drag & drop)
   - Set primary image
   - Max 10 images, max 5MB each

4. Pricing & Inventory:
   - Price (required)
   - Compare at price (optional, для показа скидки)
   - Cost per item (для расчета прибыли)
   - Stock quantity (для physical)
   - SKU (stock keeping unit)
   - Barcode

5. Для Digital:
   - File upload (digital product file)
   - File size, format display
   - Download limit

6. Для Service:
   - Duration (hours, minutes)
   - Location (address или "Online")
   - Capacity (max bookings)

7. SEO:
   - Meta title, Meta description
   - URL slug

8. Actions:
   - Save as Draft
   - Publish
   - Save Changes (если edit)
   - Preview (открыть product page в новой вкладке)

9. Валидация всех полей
10. API:
    - POST /merchant/products - создать
    - PATCH /merchant/products/:id - обновить
    - POST /merchant/products/upload-image - загрузить изображение

Используй react-dropzone для upload, React Hook Form
```

### Промпт 8.4: Merchant Orders Page

```
Создай страницу заказов продавца client/src/pages/Merchant/OrdersPage.tsx:

Требования:
1. Заголовок "Orders"
2. Tabs:
   - New (PENDING, PAYMENT_CONFIRMED)
   - Processing (PREPARING)
   - Shipped
   - Completed
   - Cancelled
3. Orders table:
   - Columns: Order #, Customer, Products, Total, Status, Date, Actions
   - Actions: View Details, Update Status
4. Filters:
   - Date range picker
   - Search by order number or customer
5. Quick actions:
   - Mark as Preparing
   - Mark as Shipped (+ tracking number input)
   - Cancel order
6. Bulk actions: Print shipping labels, Export CSV
7. Order details modal или sidebar:
   - Full order info
   - Customer contact
   - Line items
   - Update status dropdown
   - Add tracking number form
8. API:
   - GET /merchant/orders
   - PATCH /merchant/orders/:id/status
   - POST /merchant/orders/:id/tracking

Используй react-bootstrap Table, Dropdown
```

---

## Фаза 9: Дополнительный функционал

### Промпт 9.1: Global Search

```
Создай глобальный поиск в Navbar:

Требования:
1. Search input в центре Navbar
2. Autocomplete dropdown с suggestions при вводе (debounce 300ms)
3. Suggestions:
   - Products (top 5)
   - Services (top 3)
   - Categories
4. "View all results" link внизу dropdown
5. Enter или клик на "View all" - переход на /search?q=query
6. Highlight query в результатах
7. Keyboard navigation (arrow keys, enter, escape)
8. Mobile: search icon открывает modal с search input
9. Recent searches (localStorage, max 5)
10. API: GET /search/autocomplete?q=query

Используй react-bootstrap Form.Control, Dropdown
```

### Prompts 9.2: Search Results Page

```
Создай страницу результатов поиска client/src/pages/SearchPage.tsx:

Требования:
1. Route: /search?q=query
2. Search query из URL params
3. Search bar вверху (pre-filled)
4. Результаты grouped по типу:
   - Products (grid)
   - Services (grid)
   - Categories (list)
5. Каждая группа с заголовком и "View all" link
6. Filters sidebar (такой же как в Catalog)
7. Tabs: All, Products, Services
8. Pagination для каждой группы
9. Empty state: "No results for '{query}'" + suggestions
10. "Did you mean?" suggestions для опечаток
11. API: GET /search?q=query&type=&filters=

Loading skeleton пока идет поиск
```

### Промпт 9.3: Wishlist Store & API

```
Создай функционал Wishlist (избранное):

Файлы:
- client/src/store/wishlistStore.ts
- client/src/api/wishlist.api.ts

Store:
1. Состояние: items: Product[], isLoading
2. Методы:
   - addToWishlist(productId)
   - removeFromWishlist(productId)
   - isInWishlist(productId) -> boolean
   - loadWishlist()
3. Sync с backend

API:
- GET /wishlist - получить wishlist
- POST /wishlist/items - добавить товар
- DELETE /wishlist/items/:productId - удалить

Добавь "Add to Wishlist" button на ProductCard и ProductPage:
- Heart icon (пустое/заполненное)
- Toggle on/off
- Toast notification
- Update wishlist badge в Navbar

Используйте react-icons/ai: AiOutlineHeart, AiFillHeart
```

### Промпт 9.4: Wishlist Page

```
Создай страницу Wishlist client/src/pages/WishlistPage.tsx:

Требования:
1. Заголовок "My Wishlist"
2. Products grid (используй ProductCard)
3. Каждый product card:
   - Remove from wishlist button (X)
   - "Add to Cart" button
   - "Move to Cart" button (add to cart + remove from wishlist)
4. Empty state: "Your wishlist is empty" + "Start adding favorites"
5. "Share Wishlist" button (copy link)
6. Filters: Product type, Price range
7. Sort: Added date, Price
8. Используй wishlistStore
9. Confirmation modal для Remove

Responsive: 4 columns на desktop, 2 на tablet, 1 на mobile
```

### Промпт 9.5: Notifications Center

```
Создай центр уведомлений:

Компоненты:
1. NotificationBell в Navbar:
   - Bell icon (react-icons/io: IoNotifications)
   - Badge с количеством непрочитанных
   - Dropdown с последними 5 уведомлениями
   - "View All" link внизу dropdown

2. Notification Dropdown Item:
   - Icon по типу уведомления
   - Title, short message
   - Time ago (e.g., "2 hours ago")
   - Unread indicator (синяя точка)
   - Клик - mark as read + перейти на related page

3. NotificationsPage (client/src/pages/NotificationsPage.tsx):
   - Tabs: All, Unread, Orders, System
   - List всех уведомлений
   - "Mark all as read" button
   - Pagination

4. Notification types:
   - ORDER_UPDATE: Order status changed
   - PAYMENT_SUCCESS: Payment confirmed
   - SHIPPING_UPDATE: Order shipped
   - BOOKING_REMINDER: Service booking reminder
   - PROMO: Promotional messages

5. API:
   - GET /notifications?unread=true
   - PATCH /notifications/:id/read
   - PATCH /notifications/read-all

Store (notificationStore.ts):
- unreadCount, notifications
- markAsRead(id), markAllAsRead()
- loadNotifications()

Опционально: WebSocket для real-time notifications
```

---

## Фаза 10: Оптимизация

### Промпт 10.1: Code Splitting & Lazy Loading

```
Оптимизируй приложение через code splitting и lazy loading:

Задачи:
1. Используй React.lazy() для route-level code splitting:
   - Landing page - eager load
   - Auth pages - lazy
   - Catalog pages - lazy
   - Checkout - lazy
   - Merchant pages - lazy (отдельный chunk)
   - Profile pages - lazy

2. Suspense boundaries с fallback:
   - Page-level: LoadingSpinner full screen
   - Component-level: Skeleton loaders

3. Prefetch critical routes:
   - Catalog при hover на Navbar link
   - Cart при hover на cart icon

4. Image lazy loading:
   - Используй loading="lazy" на img
   - Blur placeholder до загрузки

5. Vendor bundle optimization:
   - Split vendors: react, react-dom отдельно
   - Split bootstrap отдельно
   - Динамический импорт recharts только на Dashboard

Пример:
const CatalogPage = lazy(() => import('./pages/Catalog/CatalogPage'));
<Suspense fallback={<PageLoader />}>
  <CatalogPage />
</Suspense>

Проверь bundle size: npm run build && du -sh dist/assets/*
Цель: initial bundle < 200KB gzipped
```

### Промпт 10.2: Performance Optimization

```
Оптимизируй производительность React компонентов:

Задачи:
1. Мemoization:
   - Оберни ProductCard в React.memo
   - useMemo для expensive calculations (filtering, sorting)
   - useCallback для event handlers в списках

2. Virtualization для длинных списков:
   - Установи react-window
   - Используй для Catalog grid (если >100 товаров)
   - Используй для Orders list

3. Debounce & Throttle:
   - Search input: debounce 300ms
   - Scroll events: throttle 100ms
   - Window resize: debounce 200ms

4. React Query optimization:
   - Правильные staleTime для разных queries
   - prefetchQuery для предсказуемых переходов
   - keepPreviousData для pagination

5. Images:
   - Используй WebP format
   - Responsive images (srcset)
   - Lazy loading

6. Bundle analyzer:
   - npm install --save-dev rollup-plugin-visualizer
   - Найти и оптимизировать большие dependencies

7. Lighthouse audit:
   - Performance score > 90
   - Accessibility score > 90
   - Best Practices > 90

Измерь before/after с React DevTools Profiler
```

### Промпт 10.3: SEO & Meta Tags

```
Добавь SEO оптимизацию для всех страниц:

Задачи:
1. Установи react-helmet-async
2. Создай компонент SEO (client/src/components/SEO.tsx):
   - Props: title, description, keywords, image, url
   - Рендерит meta tags через Helmet
   - Open Graph tags для социальных сетей
   - Twitter Card tags

3. Добавь SEO на каждую страницу:
   - Landing: "SnailMarketplace - Buy & Sell Physical, Digital, Service Products"
   - Catalog: "Shop {category} - SnailMarketplace"
   - Product: "{product.name} - ${product.price} | SnailMarketplace"
   - Dynamic meta description из product.description

4. Structured Data (JSON-LD):
   - Product schema на ProductPage
   - BreadcrumbList schema
   - Organization schema на Landing

5. Sitemap generation:
   - Static pages sitemap
   - Dynamic products sitemap (server-side)

6. robots.txt:
   - Allow all except /merchant, /checkout, /profile

Пример:
<SEO
  title="iPhone 14 Pro - $999"
  description="Buy iPhone 14 Pro with free shipping..."
  image={product.images[0]}
  type="product"
/>

Test с Google Rich Results Test
```

### Промпт 10.4: Error Handling & Monitoring

```
Добавь comprehensive error handling и monitoring:

Задачи:
1. Error Boundary component:
   - Глобальный ErrorBoundary в App.tsx
   - Page-level ErrorBoundary для каждого route
   - Fallback UI с "Try again" button
   - Логирование ошибок в Sentry/LogRocket

2. API Error Handling:
   - Централизованный error handler в axios interceptor
   - User-friendly error messages
   - Retry logic для network errors (exponential backoff)
   - Offline detection

3. Form Validation Errors:
   - Field-level errors (под каждым input)
   - Summary errors вверху формы
   - Scroll to first error

4. Toast Notifications:
   - Success: зеленый toast, 3 sec
   - Error: красный toast, 5 sec, manual dismiss
   - Info: синий toast, 4 sec
   - Position: top-right

5. Loading States:
   - Button loading spinners
   - Page loading skeletons
   - Inline spinners для async actions
   - Disable double-submit

6. Network Status:
   - "You are offline" banner
   - Retry when back online
   - Cache failed requests

7. Monitoring:
   - Integrate Sentry для error tracking
   - Log user actions (analytics)
   - Performance monitoring (FCP, LCP, TTI)

Создай useErrorHandler custom hook для consistent error handling
```

### Промпт 10.5: Accessibility (A11y)

```
Улучши accessibility приложения до WCAG AA стандарта:

Задачи:
1. Keyboard Navigation:
   - Tab order правильный
   - Focus visible (ring outline)
   - Skip to main content link
   - Escape closes modals
   - Arrow keys для dropdowns/menus

2. ARIA attributes:
   - aria-label на иконках-кнопках
   - aria-expanded на dropdowns
   - aria-current="page" на active nav links
   - aria-live regions для dynamic content
   - role="status" на loading indicators

3. Forms:
   - label связаны с inputs (htmlFor)
   - Required fields помечены aria-required
   - Error messages связаны с aria-describedby
   - Fieldset/legend для radio groups

4. Images:
   - alt text на всех images
   - Decorative images: alt=""
   - Meaningful images: descriptive alt

5. Color Contrast:
   - Text: minimum 4.5:1 ratio
   - Large text: minimum 3:1
   - Interactive elements: 3:1
   - Проверь с Axe DevTools

6. Focus Management:
   - Focus trap в modals
   - Return focus после закрытия modal
   - Focus first error при валидации формы

7. Screen Reader Testing:
   - Test с NVDA (Windows) или VoiceOver (Mac)
   - Все interactive elements объявляются
   - Правильная структура headings (h1, h2, h3...)

8. Motion & Animation:
   - Respect prefers-reduced-motion
   - Disable animations если user prefers

Audit с Lighthouse Accessibility score, axe DevTools
```

---

## Дополнительные промпты

### Промпт: Booking Flow для Services

```
Реализуй booking flow для сервисов:

Файлы:
- client/src/pages/Booking/BookingPage.tsx
- client/src/components/features/Calendar.tsx
- client/src/store/bookingStore.ts

Требования:
1. BookingPage (для service products):
   - Service info (name, price, duration, provider)
   - Calendar component с доступными слотами
   - Time slots selection (15/30/60 min intervals)
   - Selected slot highlight
   - "Book Now" button
   - Timezone display

2. Calendar Component:
   - Monthly view
   - Доступные даты enabled, прошлые disabled
   - Busy slots показаны серым
   - Available slots зеленым
   - Selected slot синим
   - Legend
   - Navigation: previous/next month

3. Booking Flow:
   - Select date & time
   - Add to cart или Direct booking
   - Payment
   - Confirmation с calendar invite (.ics file)
   - Email reminder

4. API:
   - GET /bookings/availability/:serviceId?date=2025-11-10
   - POST /bookings - создать booking
   - POST /bookings/:id/cancel

Store:
- selectedDate, selectedTime, availableSlots
- loadAvailability(serviceId, date)
- createBooking(serviceId, dateTime)

Используй date-fns для работы с датами
```

### Промпт: Multi-language RTL Support

```
Убедись что RTL (Right-to-Left) для арабского работает корректно:

Задачи:
1. Динамическая загрузка Bootstrap RTL CSS:
   - Если locale === 'ar' -> загрузить bootstrap.rtl.min.css
   - Иначе -> bootstrap.min.css

2. Установка dir attribute:
   - <html dir={locale === 'ar' ? 'rtl' : 'ltr'}>
   - Обновлять при смене языка

3. RTL-safe стили:
   - Используй margin-start/end вместо left/right
   - padding-start/end
   - text-align: start (не left)
   - Проверь что flex layouts работают

4. Icons:
   - Некоторые иконки нужно flip (arrows)
   - Используй transform: scaleX(-1) для RTL

5. Forms:
   - Labels справа для RTL
   - Placeholder text align

6. Testing:
   - Протестируй все страницы на арабском
   - Проверь overflow, text truncation
   - Проверь modals, dropdowns

7. i18n numbers:
   - Форматирование чисел для AR locale
   - Валюта справа для RTL

Пример:
const isRTL = i18n.language === 'ar';
<html dir={isRTL ? 'rtl' : 'ltr'}>
```

### Промпт: E2E Tests с Playwright

```
Напиши E2E тесты для критических user flows:

Setup:
npm install -D @playwright/test
npx playwright install

Тесты (client/e2e/):

1. auth.spec.ts:
   - Register new user
   - Login with valid credentials
   - Login with invalid credentials
   - Logout

2. catalog.spec.ts:
   - Browse catalog
   - Filter products by category
   - Search products
   - View product details

3. checkout.spec.ts:
   - Add product to cart
   - Update cart quantity
   - Complete checkout flow
   - Payment success

4. orders.spec.ts:
   - View orders list
   - View order details
   - Cancel order

5. merchant.spec.ts:
   - Create new product
   - Edit product
   - Update order status

Используй Page Object Model:
- pages/LoginPage.ts
- pages/CatalogPage.ts
- pages/CheckoutPage.ts

Fixtures:
- Authenticated user
- Test products in DB

Run: npx playwright test
CI: добавь в GitHub Actions
```

---

## Заключение

Эти промпты покрывают полную реализацию фронтенда от инфраструктуры до production-ready приложения. Используйте их последовательно или выборочно в зависимости от приоритетов проекта (MVP vs Full Features).

**Рекомендуемый порядок для MVP:**
1. Промпты Фазы 1 (инфраструктура)
2. Промпты Фазы 2 (auth)
3. Промпты Фазы 3 (catalog)
4. Промпты Фазы 4 (cart)
5. Промпты Фазы 5 (checkout)
6. Промпты Фазы 6 (orders)
7. Промпты Фазы 7 (profile)
8. Промпты Фазы 10.4 (error handling)

После MVP добавляйте остальной функционал по приоритетам бизнеса.
