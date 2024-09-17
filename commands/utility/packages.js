const { SlashCommandBuilder, StickerPackApplicationId } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');
const econtService = require('../../services/econtService');
const speedyService = require('../../services/speedyService');
const bgpostService = require('../../services/bgpostService');
const expressOneService = require('../../services/expressOneService');
const dhlService = require('../../services/dhlService');
const samedayService = require('../../services/samedayService');
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
    ),

  async execute(interaction) {
    await interaction.deferReply();

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
            let newStatuses;

            switch (pkg.courier) {
              case 'econt':
                newStatuses = await econtService.trackShipment(pkg.trackingNumber);
                break;
              case 'speedy':
                newStatuses = await speedyService.trackShipment(pkg.trackingNumber);;
                break;
              case 'bgpost':
                newStatuses = await bgpostService.trackShipment(pkg.trackingNumber);
                break;
              case 'expressOne':
                newStatuses = await expressOneService.trackShipment(pkg.trackingNumber);
                break;
              case 'dhl':
                newStatuses = await dhlService.trackShipment(pkg.trackingNumber);
                break;
              case 'sameday':
                newStatuses = await samedayService.trackShipment(pkg.trackingNumber);
                break;
              default:
                await interaction.editReply('Error: Unknown courier');
                return;
            }

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

          const packageMessage = `**Package from ${pkg.courier}:** \`\`${pkg.packageName}\`\`\n\`\`\`${statusMessages.join('\n')}\`\`\``;

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
