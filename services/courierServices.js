const econtService = require('../services/econtService');
const speedyService = require('../services/speedyService');
const bgpostService = require('../services/bgpostService');
const expressOneService = require('../services/expressOneService');
const dhlService = require('../services/dhlService');
const samedayService = require('../services/samedayService');
const boxnow = require('../services/boxnowService');

const courierServices = {
    econt: econtService,
    speedy: speedyService,
    bgpost: bgpostService,
    expressOne: expressOneService,
    dhl: dhlService,
    sameday: samedayService,
    boxnow: boxnow,
  };
  
  module.exports = courierServices;