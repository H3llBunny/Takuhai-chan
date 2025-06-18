const { DHL_API_KEY } = process.env;
const { DHL_API_URL } = process.env;

async function trackShipment(trackingNumber, calledFromPackages = false) {
  const url = `${DHL_API_URL}trackingNumber=${trackingNumber}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'DHL-API-Key': DHL_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const shipmentData = await response.json();

    return getShipmentStatuses(shipmentData, calledFromPackages);
  } catch (error) {
    console.error('Error tracking the shipment:', error);
    if (calledFromPackages) {
      return [];
    }
    throw new Error('Error, please make sure the tracking number is correct');
  }
}

function getShipmentStatuses(shipmentData, calledFromPackages = false) {
  if (!shipmentData || !shipmentData.shipments || shipmentData.length === 0) {
    if (calledFromPackages) {
      return [];
    }
    return 'Няма налични данни за пратката';
  }

  const statuses = shipmentData.shipments[0].events.map((event) => {
    const status = event.description;
    const country = event.location?.address?.addressLocality || "";
    const timestamp = event.timestamp;

    return {
      description: `${status} - ${country}`,
      time: timestamp,
    };
  });

  return statuses.reverse();
}

module.exports = {
  trackShipment,
};
