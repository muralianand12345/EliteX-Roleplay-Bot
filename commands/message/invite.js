const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");


module.exports = {
    name: 'invite',
    description: "Invite Embed",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_INVITE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        await message.delete();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({
                name: 'ICONIC Roleplay',
                iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                url: 'https://discord.gg/8pEzKpqFgK'
            })
            .setTitle('https://discord.gg/8pEzKpqFgK')
            .setURL('https://discord.gg/8pEzKpqFgK')
            .setDescription('**Tamil Community Roleplay Server**')
            .setThumbnail('https://cdn.discordapp.com/attachments/1097420467532472340/1099666661990219887/Logo.gif')
            .setFooter({
                text: 'ICONIC Roleplay',
                iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png'
            });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    //.setCustomId('invite-button')
                    .setLabel('Join Server')
                    .setURL('https://discord.gg/8pEzKpqFgK')
                    .setStyle(ButtonStyle.Link),
            );

        return message.channel.send({
            embeds: [embed],
            components: [button]
        });
    }
};