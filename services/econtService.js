const statusMessages = require('./statusMessages');
require('dotenv').config();
const { ECONT_API_URL } = process.env;

async function trackShipment(trackingNumber) {
  const requestBody = {
    shipmentNumbers: [trackingNumber],
  };

  try {
    const response = await fetch(ECONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const shipmentData = await response.json();

    shipmentData;
    return getLatestShipmentStatus(shipmentData);
  } catch (error) {
    console.error('Error tracking the shipment:', error);
    throw new Error('Error, please make sure the tracking number is correct');
  }
}

function getLatestShipmentStatus(shipmentData) {
  if (!shipmentData || shipmentData.lenght === 0) {
    return 'Няма налични данни за пратката';
  }

  const shipmentStatuses = shipmentData?.shipmentStatuses?.[0]?.status;

  if (!shipmentStatuses || shipmentStatuses.trackingEvents.length === 0) {
    return [{ status: 'Няма налични данни за пратката', time: new Date().toUTCString() }];
  }

  const statuses = shipmentStatuses.trackingEvents.map((event) => {
    const mappedStatus = statusMessages[event.destinationType];
    const officeName = event.officeName;
    const evenTime = new Date(event.time).toUTCString();

    return {
      description: `${mappedStatus} - ${officeName} Eконт`,
      time: evenTime,
    };
  });

  return statuses;
}

module.exports = {
  trackShipment,
};
