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
      const historyList = document.querySelector('ul.awb-history-parcel-list');
      return historyList.children.length === 0;
    });

    if (isInvalid) {
      if (calledFromPackages) {
        console.log('Invalid tracking number found.');
        return [];
      }

      throw new Error('Tracking number is invalid.');
    }

    const result = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('ul.awb-history-parcel-list li');

      return Array.from(statusElements).map((element) => {
        const status = element.querySelector('.status-description')?.textContent.trim() || '';
        const infoElements = element.querySelectorAll('.small-description-awb');
        const time = infoElements[0]?.textContent.trim() || '';
        const location = infoElements[1]?.textContent.trim() || '';

        return {
          description: `${status} - ${location}`,
          time: `${time}`,
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

    return result.reverse();
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
