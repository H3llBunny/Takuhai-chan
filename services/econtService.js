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

    return getLatestShipmentStatus(shipmentData);

  } catch (error) {
    console.error('Error tracking the shipment:', error);
    throw new Error('Error, please make sure the tracking number is correct');
  }
}

function getLatestShipmentStatus(shipmentData) {
  if(!shipmentData || shipmentData.lenght === 0) {
    return 'Няма налични данни за пратката';
  }

  const shipmentStatus = shipmentData?.shipmentStatuses?.[0]?.status;

  if (!shipmentStatus || !shipmentStatus.trackingEvents || shipmentStatus.trackingEvents.length === 0) {
    return 'Няма налични данни за пратката';
  }

  const latestEvent  = shipmentStatus.trackingEvents.reduce((latest, current) => {
    return current.time > latest.time ? current : latest;
  });

  const { destinationType, officeName } = latestEvent;

  const mappedStatus = statusMessages[destinationType] || 'Статусът не е наличен';
  
  return `${mappedStatus} - ${officeName + ' Еконт' || 'Офисът не е наличен'}`;
}

module.exports = {
  trackShipment,
};
