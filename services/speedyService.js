const puppeteer = require('puppeteer');
const { SPEEDY_URL } = process.env;

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: true,
    browser: 'firefox',
  });

  const page = await browser.newPage();

  await page.goto(`${SPEEDY_URL}${trackingNumber}`);

  try {
    await page.waitForSelector('table.shipment-table', { timeout: 5000 });
  } catch (error) {
    await browser.close();
    if (calledFromPackages) {
      console.log(`Error: ${error.message }`);
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
        description: `${description}${location? ' - ' + location : ''}`,
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

module.exports = {
  trackShipment,
};
