const puppeteer = require('puppeteer-core');

async function trackShipment(trackingNumber) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const page = await browser.newPage();

  await page.goto('https://expressone.bg/tracking');

  await page.type('#barcodeInput', trackingNumber);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  await page.click('button.button--big');

  try {
    await page.waitForSelector('.timeline', { timeout: 10000 });
  } catch (error) {
    await browser.close;
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
    throw new Error('No tracking updates available');
  }
  
  return allstatuses;
}

module.exports = {
  trackShipment,
};
