const { SlashCommandBuilder } = require('discord.js');
const mongoDbService = require('../../services/mongoDbService');

module.exports = {
  data: new SlashCommandBuilder().setName('packages').setDescription('Returns the last status of all your packages'),
  async execute(interaction) {
    await interaction.deferReply();

    


    await interaction.editReply();
  },
};
