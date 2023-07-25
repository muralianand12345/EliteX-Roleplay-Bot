const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: 'verifymsg',
    description: "Verify MSG",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_VERIFYMSG`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        await message.delete();

        const embed = new EmbedBuilder()
            .setColor('#454B1B')
            .setAuthor({
                name: 'ICONIC Roleplay',
                iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                url: 'https://discord.gg/8pEzKpqFgK'
            })
            .setTitle('VERIFY HERE')
            .setDescription('**Click the button to verify!**')
            .setThumbnail('https://cdn.discordapp.com/attachments/1097420467532472340/1099666661990219887/Logo.gif')

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify-button')
                    .setLabel('Verify Here')
                    .setStyle(ButtonStyle.Primary),
            );

        return message.channel.send({
            embeds: [embed],
            components: [button]
        });
    }
};