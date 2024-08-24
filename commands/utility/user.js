const { SlashCommandBuilder, CommandInteractionOptionResolver } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Provides information about the user.'),
    async execute(interaction) {
        await interaction.reply(`Tis command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
    },
};