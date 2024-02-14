const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: 'getvisaform',
    description: 'Send visa button',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setAuthor({ name: client.user.username, icon: client.user.displayAvatarURL() })
            .setDescription("```Get Visa Holder Role```");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('visa-get')
                    .setLabel('Visa Holder')
                    .setStyle(ButtonStyle.Secondary)
            )

        return message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
}