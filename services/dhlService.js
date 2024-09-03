require('dotenv').config();
const { DHL_API_KEY } = process.env;
const { DHL_API_URL } = process.env;

async function trackShipment(trackingNumber) {
  const url = `${DHL_API_URL}trackingNumber=${trackingNumber}&service=express`;

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


    return getShipmentStatuses(shipmentData);
  } catch (error) {
    console.error('Error tracking the shipment:', error);
    throw new Error('Error, please make sure the tracking number is correct');
  }
}

function getShipmentStatuses(shipmentData) {
    if (!shipmentData || shipmentData.lenght === 0) {
        return 'Няма налични данни за пратката';
      }

    const statuses = shipmentData.shipments[0].events.map((event) => {
        const status = event.description;
        const country = event.location.address.countryCode;
        const timestamp = event.timestamp;

        return {
            description: `${status} - ${country}`,
            time: timestamp,
        };
    });

    const reversedStatuses = statuses.reverse();

    return reversedStatuses;
}

module.exports = {
  trackShipment,
};
