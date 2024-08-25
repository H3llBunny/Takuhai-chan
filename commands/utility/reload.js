const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const { ADMIN_ID } = process.env;

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads a command.')
    .addStringOption((option) => option.setName('command').setDescription('The command to reload').setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id === ADMIN_ID) {
      const commandName = interaction.options.getString('command', true).toLowerCase();
      const command = interaction.client.commands.get(commandName);

      if (!command) {
        return interaction.reply(`There is no command with name \`${commandName}\`!`);
      }

      delete require.cache[require.resolve(`./${command.data.name}.js`)];
      try {
        interaction.client.commands.delete(command.data.name);
        const newCommand = require(`./${command.data.name}.js`);
        interaction.client.commands.set(newCommand.data.name, newCommand);
        await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
      } catch (error) {
        console.error(error);
        await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
      }
    } else {
      return interaction.reply('Only the admin can use this command.');
    }
  },
};
