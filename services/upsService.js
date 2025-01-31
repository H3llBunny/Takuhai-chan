const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const browser = await puppeteer.launch({
    headless: true,
    browser: 'firefox',
  });

  const page = await browser.newPage();

  try {
    await page.goto(`https://www.ups.com/track?tracknum=${trackingNumber}`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isInvalid = await page.evaluate(() => {
      const button = document.querySelector('#st_App_View_Details');
      if (!button) return true;
      button.click();
      return false;
    });

    if (isInvalid) {
      if (calledFromPackages) {
        console.log('Invalid tracking number found.');
        return [];
      }

      throw new Error('Tracking number is invalid.');
    }

    const allStatuses = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('div.sub-detail-container tbody.ng-star-inserted tr');

      return Array.from(statusElements).map((element) => {
        const dateTimeTd = element.querySelector('td:nth-child(1)');
        const dateTimeText = dateTimeTd?.innerText.trim() || '';

        const dateTimeParts = dateTimeText.split('\n').map(part => part.trim()).filter(Boolean);

        const date = dateTimeParts[0] || '';
        const time = dateTimeParts[1] || '';

        const descriptionTd = element.querySelector('td:nth-child(2)');
        const description = descriptionTd.textContent.split('\n').map(line => line.trim()).filter(Boolean).join(' - ').trim();
        return {
          description: description,
          time: `${date} - ${time}`,
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

    return allStatuses.reverse();
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = {
  trackShipment,
};
