const { SlashCommandBuilder } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');

module.exports = {
  data: new SlashCommandBuilder().setName('packages').setDescription('Returns the last status of all your packages'),
  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const usersCollection = await mongoDbService.getCollection('users');
    const user = await usersCollection.findOne({ _id: userId });

    if (user) {
      const userPackages = await user.packages;
      const updatedPackages = [];

      for (const pkg of userPackages) {
        const timeDifferenceInHours = (new Date() - new Date(pkg.lastRefresh)) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 1) {
          let newStatus; // Here I will call the services which will get the latest status
          await usersCollection.updateOne(
            { _id: userId, 'packages.trackingNumber': pkg.trackingNumber },
            {
              $set: {
                'packages.$.lastStatus': newStatus,
                'packages.$.lastRefresh': new Date().toUTCString(),
              },
            }
          );

          pkg.lastStatus = newStatus;
        }

        updatedPackages.push(`**Package name:** \`\`${pkg.packageName}\`\` **Last status:** \`\`${pkg.lastStatus}\`\``);
      }

      const replyMessage = updatedPackages.join('\n');
        //updatedPackages.length > 0 ? updatedPackages.join('\n') : "You don't have any packages being tracked";

      await interaction.editReply(replyMessage);
    } else {
      await interaction.editReply('No packages found for your account');
    }
  },
};
