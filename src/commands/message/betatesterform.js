const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "initbetaform",
    description: "Initializes the beta tester form",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`Apply for the Beta Tester role by clicking the "Apply" button below!`)
            .setThumbnail(client.user.displayAvatarURL());

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('apply-open-beta')
                    .setLabel('Open Beta')
                    .setStyle(ButtonStyle.Secondary)
            );

        return message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
}