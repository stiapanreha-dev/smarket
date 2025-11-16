# Product Import Script

Автоматический импорт товаров с сайта American Creator в SnailMarketplace.

## Требования

- Node.js (уже установлен в проекте)
- curl
- Запущенные backend и database

## Использование

### Импорт на локальный сервер

```bash
./scripts/import-product.sh <product_url> <email> <password>
```

### Импорт на production (рекомендуется)

**Настройка (один раз):**

```bash
# Скопируйте файл с примером
cp scripts/.env.example scripts/.env

# Отредактируйте credentials (если нужно)
nano scripts/.env
```

**Импорт товара:**

```bash
# Просто укажите URL товара - всё остальное автоматически!
./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/199/"
```

Скрипт автоматически:
- ✅ Прочитает креды из `scripts/.env`
- ✅ Импортирует товар на production
- ✅ Исправит URL картинок с localhost на production

**Или вручную** (если нужен полный контроль):

```bash
API_BASE="https://smarket.sh3.su/api/v1" ./scripts/import-product.sh \
  "https://american-creator.ru/catalog/must_have/199/" \
  "stepun+2@gmail.com" \
  "270176As!"

# Затем вручную исправить URL
./scripts/fix-image-urls.sh
```

### Параметры

- `product_url` - URL товара на сайте american-creator.ru
- `email` - Email мерчанта в системе (по умолчанию: stepun+2@gmail.com)
- `password` - Пароль мерчанта (по умолчанию: 270176As!)

### Примеры

**Локальный импорт:**
```bash
./scripts/import-product.sh \
  "https://american-creator.ru/catalog/must_have/199/" \
  "stepun+2@gmail.com" \
  "270176As!"
```

**Production импорт (простой и автоматический):**
```bash
# Импортировать один товар
./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/199/"

# Импортировать несколько товаров подряд
./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/199/"
./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/203/"
./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/205/"
```

Каждый импорт автоматически исправляет URL картинок!

## Что делает скрипт

1. **Авторизация** - Логинится в систему и получает access token
2. **Парсинг** - Извлекает информацию о товаре:
   - Название
   - Короткое описание
   - Полное описание
   - Цена
   - Характеристики (объем, цвет, наличие коробки)
   - URL всех изображений
3. **Загрузка изображений** - Скачивает все фото товара с сайта
4. **Создание товара** - Создает товар в системе через API с полными данными
5. **Загрузка фото** - Загружает все изображения через API
6. **Обновление товара** - Привязывает все изображения к товару
7. **Вывод результата** - Показывает ID товара и ссылку для просмотра

## Выходные данные

После успешного выполнения скрипт выводит:

```
=== Import completed successfully! ===

Product ID: 1ba35f43-eebe-4d3d-9375-b0824c90ba5a
Product URL: http://localhost:5173/catalog/1ba35f43-eebe-4d3d-9375-b0824c90ba5a

Product details:
"title":"Construction Gel 15 ml"
"base_price_minor":"125000"
"image_url":"http://172.26.204.61:3000/uploads/products/..."
```

## Особенности

- ✅ Автоматическое извлечение информации с сайта
- ✅ Парсинг короткого описания из preview_text
- ✅ Парсинг характеристик из таблицы (объем, цвет, коробка)
- ✅ Сохранение характеристик в `attrs.specifications`
- ✅ Загрузка **всех** изображений товара (галерея)
- ✅ Правильный парсинг цены из meta-тегов с тремя уровнями fallback
- ✅ Создание товара с правильным форматом EditorJS
- ✅ Автоматическая генерация slug из названия
- ✅ Конвертация цены в minor units (копейки)
- ✅ Создание уникального SKU
- ✅ Установка SEO метаданных
- ✅ Корректная обработка UTF-8 (кириллицы)
- ✅ Цветной вывод в консоль
- ✅ Автоматическая очистка временных файлов

## Обработка ошибок

Скрипт проверяет каждый шаг и останавливается при ошибке:

- Неудачная авторизация
- Не удалось извлечь информацию о товаре
- Ошибка создания товара
- Ошибка загрузки изображения

В случае ошибки выводится детальная информация для диагностики.

## Технические детали

### API Endpoints используемые скриптом

- `POST /api/v1/auth/login` - Авторизация
- `POST /api/v1/merchant/products` - Создание товара
- `POST /api/v1/merchant/products/upload-image` - Загрузка изображения
- `PATCH /api/v1/merchant/products/{id}` - Обновление товара
- `GET /api/v1/products/{id}` - Получение информации о товаре

### Формат данных

**EditorJS Description:**
```json
{
  "time": 1763111400000,
  "blocks": [
    {
      "id": "block1",
      "type": "header",
      "data": {
        "text": "Product Title",
        "level": 2
      }
    },
    {
      "id": "block2",
      "type": "paragraph",
      "data": {
        "text": "Product description..."
      }
    }
  ],
  "version": "2.31.0"
}
```

**Price:** Цены хранятся в minor units (1 рубль = 100 единиц)

## Лицензия

MIT
