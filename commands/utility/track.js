const { SlashCommandBuilder } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');
const courierServices = require('../../services/courierServices');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Add a new tracking number')
    .addStringOption((option) =>
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
          { name: 'Sameday', value: 'sameday' }
        )
    )
    .addStringOption((option) =>
      option.setName('tracking_number').setDescription('Please provide your tracking number').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('package_name').setDescription('Please provide a name for the package').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const courier = interaction.options.getString('couriers');
    const trackingNumber = interaction.options.getString('tracking_number');
    const packageName = interaction.options.getString('package_name');
    const userId = interaction.user.id;

    let statuses = [];

    try {
      const courierService = courierServices[courier];

      if (!courierService) {
        throw new Error('Invalid courier selected');
      }

      statuses = await courierService.trackShipment(trackingNumber);
    } catch (error) {
      await interaction.editReply(error.message);
      return;
    }

    const usersCollection = await mongoDbService.getCollection('users');
    const user = await usersCollection.findOne({ _id: userId });

    const packageData = {
      courier,
      trackingNumber,
      packageName,
      statuses: statuses,
      lastRefresh: new Date().toUTCString(),
    };

    if (user) {
      const existingPackage = user.packages.find((pkg) => pkg.trackingNumber === trackingNumber);

      if (existingPackage) {
        await interaction.editReply(
          `<\@${interaction.user.id}> this package is already tracked, use command \`\`/packages\`\` to get the latest 3 statuses`
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
        await interaction.channel.send(
          `<\@${interaction.user.id}> Package with name: **${packageName}** was added to your tracking list`,
          { ephemeral: false }
        );
        await interaction.deleteReply();
      }
    } else {
      await usersCollection.insertOne({
        _id: userId,
        packages: [packageData],
      });
      await interaction.channel.send(
        `<\@${interaction.user.id}> Package with name: **${packageName}** was added to your tracking list`,
        { ephemeral: false }
      );
      await interaction.deleteReply();
    }
  },
};
