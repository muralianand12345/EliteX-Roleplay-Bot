const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: 'crashre',
    description: "Crash Report Form",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_CRASHRE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        await message.delete();

        const embed = new EmbedBuilder()
            .setColor('#454B1B')
            .setAuthor({
                name: 'ICONIC Roleplay',
                iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                url: 'https://discord.gg/8pEzKpqFgK'
            })
            .setTitle('CRASH REPORT')

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('crashre-button')
                    .setEmoji('💥')
                    .setLabel('Report')
                    .setStyle(ButtonStyle.Danger),
            );

        return message.channel.send({
            embeds: [embed],
            components: [button]
        });
    }
};