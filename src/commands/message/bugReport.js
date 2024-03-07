const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: 'bugreport',
    description: "Sends a bug report embed",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setAuthor({ name: client.user.username, icon: client.user.displayAvatarURL() })
            .setDescription("```Bug Report```")
            .setFooter({ text: "Please describe the bug you found" });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bug-report')
                    .setLabel('Bug Report')
                    .setStyle(ButtonStyle.Secondary)
            )

        return message.channel.send({
            embeds: [embed],
            components: [row]
        });

    }
}