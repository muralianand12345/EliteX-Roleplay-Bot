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

        const boostLvl = message.guild.premiumTier;
        var inviteLink;
        if (boostLvl.toString() === "3") {
            inviteLink = "https://discord.gg/iconicrp";
        } else {
            inviteLink = "https://discord.gg/8pEzKpqFgK";
        }
        
        await message.delete();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({
                name: 'ICONIC Roleplay',
                iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                url: inviteLink
            })
            .setTitle(inviteLink)
            .setURL(inviteLink)
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
