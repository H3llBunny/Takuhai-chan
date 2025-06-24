const { SlashCommandBuilder, StickerPackApplicationId, MessageFlags } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');
const courierServices = require('../../services/courierServices');
const MAX_MESSAGE_LENGTH = 2000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('packages')
    .setDescription('Returns the last 3 statuses of all your packages')
    .addBooleanOption((option) =>
      option
        .setName('full_history')
        .setDescription('Show the full history of statuses for all your packages')
        .setRequired(false)
    )
    .addBooleanOption((option) => 
      option
        .setName('ephemeral')
        .setDescription('Only you will see this response')
        .setRequired(false)
    ),

  async execute(interaction) {
    const ephemeralCheck = interaction.options.getBoolean('ephemeral') || false;
    if (ephemeralCheck) {
    await interaction.deferReply(ephemeralCheck ? { flags: MessageFlags.Ephemeral } : '');
    } else {
      await interaction.deferReply();
    }

    const userId = interaction.user.id;
    const fullHistory = interaction.options.getBoolean('full_history') || false;
    const usersCollection = await mongoDbService.getCollection('users');
    const user = await usersCollection.findOne({ _id: userId });

    if (user) {
      const userPackages = await user.packages;
      const messages = [];

      if (userPackages.length === 0) {
        await interaction.editReply("You don't have any packages being tracked.");
        return;
      } else {
        for (const pkg of userPackages) {
          const timeDifferenceInHours = (new Date() - new Date(pkg.lastRefresh)) / (1000 * 60 * 60);

          if (timeDifferenceInHours > 1) {
            const courierService = courierServices[pkg.courier];

            if (!courierService) {
              await interaction.editReply('Error: Unknown courier');
              return;
            }

            const newStatuses = await courierService.trackShipment(pkg.trackingNumber, true);

            if (newStatuses && newStatuses.length > 0){
              await usersCollection.updateOne(
                { _id: userId, 'packages.trackingNumber': pkg.trackingNumber },
                {
                  $set: {
                    'packages.$.statuses': newStatuses,
                    'packages.$.lastRefresh': new Date().toUTCString(),
                  },
                }
              );
  
              pkg.statuses = newStatuses;
            }
          }

          const statusesToDisplay = fullHistory ? pkg.statuses : pkg.statuses.slice(-3);

          const statusMessages = statusesToDisplay.map((status) => {
            let formattedTime;

            const date = new Date(status.time);
            if (isNaN(date.getTime())) {
              formattedTime = status.time;
            } else {
              formattedTime = date.toLocaleString();
            }

            return `- ${status.description} - ${formattedTime}`;
          });

          const packageMessage = `**Package from ${pkg.courier.toUpperCase()}:** \`\`${pkg.packageName}\`\`\n\`\`\`${statusMessages.join('\n')}\`\`\``;

          messages.push(packageMessage);
        }
      }

      let currentMessage = '';
      for (const msg of messages) {
        if (currentMessage.length + msg.length > MAX_MESSAGE_LENGTH) {
          await interaction.followUp(currentMessage);
          currentMessage = msg;
        } else {
          currentMessage += (currentMessage ? '\n' : '') + msg;
        }
      }

      if (currentMessage.length > 0) {
        await interaction.followUp(currentMessage);
      }
    } else {
      await interaction.editReply('No packages found for your account');
    }
  },
};
