const statusMessages = require('./statusMessages');
const { ECONT_API_URL } = process.env;

async function trackShipment(trackingNumber, calledFromPackages = false) {
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
      if (calledFromPackages) {
        console.log(`HTTP error! status: ${response.status}`);
        return [];
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const shipmentData = await response.json();

    if (!shipmentData || shipmentData.length === 0) {
      if (calledFromPackages) {
        return [];
      }
      return [];
    }

    return getShipmentStatuses(shipmentData);
  } catch (error) {
    if (calledFromPackages) {
      console.error('Error tracking the shipment:', error);
      return [];
    }

    throw new Error('Error, please make sure the tracking number is correct');
  }
}

function getShipmentStatuses(shipmentData) {
  const shipmentStatuses = shipmentData?.shipmentStatuses?.[0]?.status;

  if (!shipmentStatuses || !shipmentStatuses.trackingEvents || shipmentStatuses.trackingEvents.length === 0) {
    return [{ description: 'Няма налични данни за пратката', time: new Date().toUTCString() }];
  }

  const statuses = shipmentStatuses.trackingEvents.map((event) => {
    const mappedStatus = statusMessages[event.destinationType];
    const officeName = event.officeName;
    const eventTime = new Date(event.time).toUTCString();

    return {
      description: `${mappedStatus} - ${officeName} Eконт`,
      time: eventTime,
    };
  });

  return statuses;
}

module.exports = {
  trackShipment,
};
