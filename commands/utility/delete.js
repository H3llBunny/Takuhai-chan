const { SlashCommandBuilder } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a package from the tracker')
    .addStringOption((option) =>
      option.setName('package_name').setDescription('Please provide the name of the package').setRequired(true)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const packageName = interaction.options.getString('package_name');
      const userId = interaction.user.id;

      const usersCollection = await mongoDbService.getCollection('users');
      const user = await usersCollection.findOne({ _id: userId });

      if (user) {
        const result = await usersCollection.updateOne(
          { _id: userId },
          { $pull: { packages: { packageName: packageName } } }
        );

        if (result.modifiedCount > 0) {
          await interaction.editReply(`**Package:** \`\`${packageName}\`\` was deleted from the tracker`);
        } else {
          await interaction.editReply(`**Package:** \`\`${packageName}\`\` was not found in the tracker`);
        }
      } else {
        await interaction.editReply('You package tracker is empty');
      }
    } catch (error) {
      console.log(error);
    }
  },
};
