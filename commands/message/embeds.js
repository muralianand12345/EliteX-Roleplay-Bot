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

        var User = args[0];
        var Message = args.slice(1).join(" ");

        message.delete()

        const embed = new EmbedBuilder()
        .setColor('#FFC0CB')
        .setTitle('EMS Application')
        .setDescription('`Thank you for your interest in joining our EMS team! Click the button below to proceed with your application.`')

        const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('apply-ice')
            .setLabel('APPLY')
            .setStyle(ButtonStyle.Success)
        )

        await message.channel.send({ 
            embeds: [embed],
            components: [button]
        });
    }
};