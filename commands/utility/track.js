const { SlashCommandBuilder } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Add a new tracking number')
    .addStringOption((option) =>
      option
        .setName('couriers')
        .setDescription('Choose a courier')
        .setRequired(true)
        .addChoices({ name: 'Econt', value: 'econt' }, { name: 'Speedy', value: 'speedy' })
    )
    .addStringOption((option) =>
      option.setName('tracking_number').setDescription('Please provide your tracking number').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('package_name').setDescription('Please provide a name for the package').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const courier = interaction.options.getString('couriers');
    const trackingNumber = interaction.options.getString('tracking_number');
    const packageName = interaction.options.getString('package_name');
    const userId = interaction.user.id;

    // switch case for couriers which service to use
    const latestStatus = 'test status';
    //if success
    const usersCollection = await mongoDbService.getCollection('users');
    const user = await usersCollection.findOne({ _id: userId });
    const packageData = {
      courier,
      trackingNumber,
      packageName,
      lastStatus: latestStatus,
      lastRefresh: new Date().toUTCString(),
    };

    if (user) {
      const existingPackage = user.packages.find((pkg) => pkg.trackingNumber === trackingNumber);

      if (existingPackage) {
        await usersCollection.updateOne(
          { _id: userId, 'packages.trackingNumber': trackingNumber },
          {
            $set: {
              'packages.$.lastStatus': latestStatus,
              'packages.$.lastRefresh': new Date().toUTCString(),
            },
          }
        );
      } else {
        await usersCollection.updateOne(
          { _id: userId },
          {
            $push: {
              packages: packageData,
            },
          }
        );
      }
    } else {
      await usersCollection.insertOne({
        _id: userId,
        packages: [packageData],
      });
    }

    await interaction.editReply(`Latest status for ${packageName}: ${latestStatus}`);
  },
};
