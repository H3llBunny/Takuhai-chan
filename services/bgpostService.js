const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: true,
    browser: 'firefox',
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://bgpost.bg/postal-services/track-package');

    await page.type('#table-search', trackingNumber);

    await page.click('button.bg-gray');

    await page.waitForSelector('.overflow-x-auto');
  } catch (error) {
    console.error(`Error while tracking package: ${error.message}`);
    if (calledFromPackages) {
      return [];
    }

    throw new Error('There was an error loading the site, please try again.');
  }

  const noRecordsFound = await page.evaluate(() => {
    const emptyMessage = document.querySelector('.ui-datatable-empty-message');
    return emptyMessage && emptyMessage.textContent.includes('Не са намерени записи');
  });

  if (noRecordsFound) {
    await browser.close();
    if (calledFromPackages) {
      return [];
    }
    throw new Error('Не са намерени записи');
  }

  const allStatuses = await page.evaluate(() => {
    const statusElements = document.querySelectorAll('.overflow-x-auto .grid-cols-12:not(:first-child)');

    return Array.from(statusElements).map((element) => {
      const status = element.children[0].innerText.trim();
      const location = element.children[1].innerText.trim();
      const details = element.children[2].innerText.trim();
      const date = element.children[3].innerText.trim();

      if (details) {
        return {
          description: `${status} - ${location} - ${details}`,
          time: `${date}`,
        };
      } else {
        return {
          description: `${status} - ${location}`,
          time: `${date}`,
        };
      }
    });
  });

  await browser.close();
  return allStatuses;
}

module.exports = {
  trackShipment,
};
