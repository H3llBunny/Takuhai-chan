require('dotenv').config();
const { SPEEDY_API_URL, SPEEDY_USERNAME, SPEEDY_PW } = process.env;

async function trackShipment(trackingNumber) {
  const requestBody = {
    userName: SPEEDY_USERNAME,
    password: SPEEDY_PW,
    shipmentIds: [trackingNumber],
  };

  try {
    const response = await fetch(SPEEDY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Error from Speedy API: ${data.error}`);
    }

    const shipmentData = data.shipments[0];

    return getLatestShipmentStatus(shipmentData);

  } catch (error) {
    console.error('Error tracking the shipment:', error);
    throw new Error('Error, please make sure the tracking number is correct');
  }
}

function getLatestShipmentStatus(shipmentData) {
    if (!shipmentData) {
        return 'No shipment data available';
      }
}

module.exports = {
    trackShipment,
};
