/**
 * Parse product page using Puppeteer (headless browser)
 * This allows us to extract JavaScript-rendered content
 */

const puppeteer = require('puppeteer');

const url = process.argv[2];

if (!url) {
  console.error('Usage: node parse-product-puppeteer.js <product_url>');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Extract product information
    const productInfo = await page.evaluate(() => {
      // Extract title
      const titleEl = document.querySelector('h1');
      const title = titleEl ? titleEl.textContent.trim() : 'Unknown Product';

      // Extract price
      let price = 0;
      const priceMetaEl = document.querySelector('meta[itemprop="price"]');
      if (priceMetaEl) {
        price = parseInt(priceMetaEl.getAttribute('content') || '0');
      }

      // Extract all images - look for product images
      const imageElements = document.querySelectorAll('img');

      const step1 = Array.from(imageElements).map(img =>
        img.src || img.getAttribute('data-src') || img.getAttribute('data-original')
      );

      const step2 = step1.filter(src => src);
      const step3 = step2.filter(src => src.includes('iblock'));
      const step4 = step3.filter(src => src.match(/\.(jpg|jpeg|png|webp)$/i));

      // Filter out small thumbnails (160x160), keep only large ones (640x640) or originals
      const step5 = step4.filter(src => !src.includes('/160_160_'));

      const step6 = step5.filter((src, index, self) => self.indexOf(src) === index);

      const images = step6.map(src => {
        // Ensure full URL
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) return 'https://american-creator.ru' + src;
        return src;
      });

      // Extract short description
      const previewTextEl = document.querySelector('.preview_text');
      const shortDescription = previewTextEl
        ? previewTextEl.textContent.replace(/\s+/g, ' ').trim().substring(0, 500)
        : '';

      // Extract detailed description sections from specific classes
      const descriptionParts = [];

      // Extract main description (Описание)
      const detailTextMain = document.querySelector('.detail_text_main');
      if (detailTextMain) {
        const mainText = detailTextMain.textContent.trim();
        if (mainText.length > 0) {
          descriptionParts.push(mainText);
        }
      }

      // Extract application info (Применение)
      const detailTextApplication = document.querySelector('.detail_text_application');
      if (detailTextApplication) {
        const appText = detailTextApplication.textContent.trim();
        if (appText.length > 0) {
          descriptionParts.push(appText);
        }
      }

      // Extract application instructions (Нанесение)
      const detailTextDrawing = document.querySelector('.detail_text_drawing');
      if (detailTextDrawing) {
        const drawText = detailTextDrawing.textContent.trim();
        if (drawText.length > 0) {
          descriptionParts.push(drawText);
        }
      }

      const description = descriptionParts.join('\n\n');

      // Extract specifications
      const specifications = {};

      // Volume
      const volumeEl = document.evaluate(
        "//span[@itemprop='name' and contains(text(), 'Объем')]/following::span[@itemprop='value'][1]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (volumeEl) {
        const volumeMatch = volumeEl.textContent.match(/(\d+)/);
        if (volumeMatch) specifications.volume_ml = parseInt(volumeMatch[1]);
      }

      // Color
      const colorEl = document.evaluate(
        "//span[@itemprop='name' and contains(text(), 'Цвет')]/following::span[@itemprop='value'][1]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (colorEl) {
        specifications.color = colorEl.textContent.trim();
      }

      // Box included
      const boxEl = document.evaluate(
        "//span[@itemprop='name' and contains(text(), 'коробка')]/following::span[@itemprop='value'][1]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (boxEl) {
        const boxValue = boxEl.textContent.trim().toLowerCase();
        specifications.box_included = boxValue === 'да' || boxValue === 'yes';
      }

      return {
        title,
        price,
        images,
        short_description: shortDescription,
        description,
        specifications
      };
    });

    console.log(JSON.stringify(productInfo));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
