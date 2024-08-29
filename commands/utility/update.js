const { SlashCommandBuilder } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update a package name from the tracker')
    .addStringOption((option) =>
      option.setName('package_name').setDescription('Please provide the current name of the package').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('new_name').setDescription('Please provide the new name of the package').setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const packageName = interaction.options.getString('package_name');
    const newPackageName = interaction.options.getString('new_name');
    const userId = interaction.user.id;

    const usersCollection = await mongoDbService.getCollection('users');
    const user = await usersCollection.findOne({ _id: userId });

    if (user) {
      const result = await usersCollection.updateOne(
        { _id: userId, 'packages.packageName': packageName },
        { $set: { 'packages.$.packageName': newPackageName } }
      );

      if (result.modifiedCount > 0) {
        await interaction.editReply(
          `**Package name was updated from:** \`\`${packageName}\`\` to \`\`${newPackageName}\`\``
        );
      } else {
        await interaction.editReply(`**Package:** \`\`${packageName}\`\` was not found`);
      }
    } else {
      await interaction.editReply(`Your package tracker is empty`);
    }
  },
};
