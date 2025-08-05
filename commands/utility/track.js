const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');
const courierServices = require('../../services/courierServices');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Add a new tracking number')
    .addStringOption(option =>
      option
        .setName('couriers')
        .setDescription('Choose a courier')
        .setRequired(true)
        .addChoices(
          { name: 'Econt', value: 'econt' },
          { name: 'Speedy', value: 'speedy' },
          { name: 'BG Post', value: 'bgpost' },
          { name: 'ExpressOne', value: 'expressOne' },
          { name: 'DHL', value: 'dhl' },
          { name: 'Sameday', value: 'sameday' },
          { name: 'BoxNow', value: 'boxnow' },
          { name: 'UPS', value: 'ups' }
        )
    )
    .addStringOption(option =>
      option
        .setName('tracking_number')
        .setDescription('Please provide your tracking number')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('package_name')
        .setDescription('Please provide a name for the package')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const courier = interaction.options.getString('couriers');
    const trackingNumber = interaction.options.getString('tracking_number');
    const packageName = interaction.options.getString('package_name');
    const userId = interaction.user.id;

    let statuses = [];

    try {
      const courierService = courierServices[courier];
      if (!courierService) throw new Error('Invalid courier selected');

      if (packageName.length > 300) throw new Error('Package name is too long');

      statuses = await courierService.trackShipment(trackingNumber);
    } catch (error) {
      await interaction.editReply({ content: error.message });
      return;
    }

    const usersCollection = await mongoDbService.getCollection('users');
    const user = await usersCollection.findOne({ _id: userId });

    const packageData = {
      courier,
      trackingNumber,
      packageName,
      statuses,
      lastRefresh: new Date().toUTCString(),
    };

    if (user) {
      const existingPackage = user.packages.find(pkg => pkg.trackingNumber === trackingNumber);

      if (existingPackage) {
        await interaction.editReply({
          content: `<@${userId}> This package is already tracked. Use \`/packages\` to view the latest statuses.`,
        });
        return;
      }

      await usersCollection.updateOne(
        { _id: userId },
        { $push: { packages: packageData } }
      );
    } else {
      await usersCollection.insertOne({
        _id: userId,
        packages: [packageData],
      });
    }

    await interaction.editReply({
      content: `✅ Package **${packageName}** has been added to your tracking list.`,
    });
  },
};
