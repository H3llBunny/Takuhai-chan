const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: true,
    browser: 'firefox',
  });

  const page = await browser.newPage();

  await page.goto(`https://sameday.bg/#awb=${trackingNumber}`);

  try {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const isInvalid = await page.evaluate(() => {
      const errorElement = document.querySelector('.tracker-alert.show');
      return errorElement && errorElement.innerText.includes('Невалиден AWB номер');
    });

    if (isInvalid) {
      if (calledFromPackages) {
        console.log('Invalid tracking number found.');
        return [];
      }

      throw new Error('Tracking number is invalid.');
    }

    await page.waitForSelector('ul.awb-history-list.one-parcel', { timeout: 10000 });
    
    const result = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('ul.awb-history-list.one-parcel li:not(.heading)');

      return Array.from(statusElements).map((element) => {
        const status = element.querySelector('.col-status').innerHTML.trim();
        const location = element.querySelector('.col-location').innerHTML.trim();
        const date = element.querySelector('.col-date').innerHTML.trim();
        const country = element.querySelector('.col-country').innerHTML.trim();

        return {
          description: `${status}${location ? ' - ' + location : ''}${country ? ' - ' + country : ''}`,
          time: `${date}`,
        };
      });
    });

    await browser.close();

    if (result.length === 0) {
        if (calledFromPackages) {
          console.log('No tracking updates available');
          return [];
        }
        throw new Error('No tracking updates available');
      }

    return result;
  } catch (error) {
    await browser.close();
    if (calledFromPackages) {
      console.error(error);
      return [];
    }
    throw new Error('Tracking number is invalid or there are no updates yet');
  }
}

module.exports = {
  trackShipment,
};
