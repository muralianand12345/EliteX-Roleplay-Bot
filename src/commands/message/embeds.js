const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: 'cembed',
    description: "Sends user DM reply",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_CUSTOM_EMBED`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const embed = new EmbedBuilder()
            .setTitle('**EMS Shift Log**')
            .setDescription('Name: **Ethan Henderson**\n' +
                'citizenid: **ICRP302728**\n' +
                ' Shift duration: **__12 hours__**\n' +
                ' Start date: **22/09/2023 21:20:51**\n' +
                ' End date: **22/09/2023 21:43:37**')
            .setColor('Red')
            .setFooter({ text: 'Iconic-shiftlog' });

        message.channel.send({ embeds: [embed] });
    }
};