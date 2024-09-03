const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
  async execute(interaction) {
    try {
      await interaction.reply('Pong!');
    } catch (error) {
      console.log(error);
    }
  },
};
