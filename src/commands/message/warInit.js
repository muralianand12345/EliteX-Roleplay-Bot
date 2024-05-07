const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: 'warmsg',
    description: "Sends a Init War embed",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setAuthor({ name: client.user.username, icon: client.user.displayAvatarURL() })
            .setDescription("```Start Tile War Against Other Gangs```")
            .setFooter({ text: "Press the button below to initiate a war!" })
            .setThumbnail(`${client.user.displayAvatarURL()}`);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('war-init')
                    .setLabel('Initiate War')
                    .setStyle(ButtonStyle.Danger)
            );

        return message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
}