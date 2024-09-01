const puppeteer = require('puppeteer-core');

async function trackShipment(trackingNumber) {
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  
  const page = await browser.newPage();

  await page.goto('https://bgpost.bg/postal-services/track-package');

  await page.type('#table-search', trackingNumber);

  await page.click('button.bg-gray');

  await page.waitForSelector('.overflow-x-auto');

  const noRecordsFound = await page.evaluate(() => {
    const emptyMessage = document.querySelector('.ui-datatable-empty-message');
    return emptyMessage && emptyMessage.textContent.includes('Не са намерени записи');
  });

  if (noRecordsFound) {
    await browser.close();
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
