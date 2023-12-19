const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: 'visaform',
    description: "Iconic RP Visa Form",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('#454B1B')
            .setAuthor({
                name: 'ICONIC Roleplay',
                iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                url: 'https://discord.gg/8pEzKpqFgK'
            })
            .setTitle('**Application Form**')
            .setDescription('**Click the button to apply!**')
            .setThumbnail('https://cdn.discordapp.com/attachments/1097420467532472340/1099666661990219887/Logo.gif')

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('visa-form')
                    .setLabel('Visa Form')
                    .setStyle(ButtonStyle.Primary),
            );

        await message.channel.send({
            embeds: [embed],
            components: [button]
        });

        await message.delete();
    }
};