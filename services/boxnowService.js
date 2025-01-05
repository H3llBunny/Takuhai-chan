const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: true,
    browser: 'firefox',
  });

  const page = await browser.newPage();
  try {
    await page.goto(`https://track.boxnow.bg/?track=${trackingNumber}`, { waitUntil: 'documentloaded' });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const isInvalid = await page.evaluate(() => {
      const errorElement = document.querySelector('.form-error.form-error--not-exist');
      return window.getComputedStyle(errorElement).display !== 'none';
    });

    if (isInvalid) {
      if (calledFromPackages) {
        console.log('Invalid tracking number found.');
        return [];
      }

      throw new Error('Tracking number is invalid.');
    }

    const allStatuses = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('#track-history tbody tr');

      return Array.from(statusElements).map((element) => {
        const status = element.querySelector('td:nth-child(1)')?.innerText.trim() || '';
        const dateTime = element.querySelector('td:nth-child(2)')?.innerText.trim() || '';
        const location = element.querySelector('td:nth-child(3)')?.innerText.trim() || '';

        return {
          description: location ? `${status} - ${location}` : status,
          time: dateTime,
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
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = {
  trackShipment,
};
