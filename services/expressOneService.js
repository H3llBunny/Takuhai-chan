const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: true,
    browser: 'firefox',
  });

  const page = await browser.newPage();

  await page.goto('https://expressone.bg/tracking');

  await page.type('#barcodeInput', trackingNumber);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  await page.click('button.button--big');

  try {
    await page.waitForSelector('.timeline', { timeout: 10000 });
  } catch (error) {
    await browser.close();
    if (calledFromPackages){
      console.log(`Error: ${error.message}`);
      return [];
    }
    throw new Error('Tracking number is invalid or there are no updates yet');
  }

  const allstatuses = await page.evaluate(() => {
    const statusElements = document.querySelectorAll('.timeline-period .timeline-body');

    return Array.from(statusElements).map((element) => {
      const dateTime = element.querySelector('.label--transparent').innerText.trim();
      const description = element.querySelector('h4').innerText.trim();
      const location = element.querySelector('h4 + span')?.innerText.trim() || '';

      return {
        description: `${description} - ${location}`,
        time: `${dateTime}`,
      };
    });
  });

  await browser.close();

  if (allstatuses.length === 0) {
    if (calledFromPackages){
      console.log('No tracking updates available');
      return [];
    }
    throw new Error('No tracking updates available');
  }
  
  return allstatuses;
}

module.exports = {
  trackShipment,
};
