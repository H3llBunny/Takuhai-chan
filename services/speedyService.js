const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { SPEEDY_URL } = process.env;

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  await page.goto(`${SPEEDY_URL}${trackingNumber}`);

  try {
    await page.waitForSelector('table.shipment-table', { timeout: 20000 });
  } catch (error) {
    await browser.close();
    if (calledFromPackages) {
      console.log(`Error: ${error.message}`);
      return [];
    }
    throw new Error('Tracking number is invalid or there are no updates yet');
  }

  const allStatuses = await page.evaluate(() => {
    const statusElements = document.querySelectorAll('tbody tr');

    return Array.from(statusElements).map((element) => {
      const dateTime = element.querySelector('td:nth-child(1)')?.innerText.trim() || '';
      const descriptionTd = element.querySelector('td:nth-child(2)');
      let description = descriptionTd.textContent.trim().replace(/\s+/g, ' ');
      const location = element.querySelector('td:nth-child(3)')?.innerText.trim() || '';

      return {
        description: `${description}${location ? ' - ' + location : ''}`,
        time: `${dateTime}`,
      };
    });
  });

  await browser.close();

  if (allStatuses.length === 0) {
    if (calledFromPackages) {
      console.log('No tracking updates available.');
      return [];
    }
    throw new Error('No tracking updates available');
  }

  return allStatuses;
}

module.exports = { trackShipment };