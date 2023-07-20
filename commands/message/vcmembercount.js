const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: 'vclogger',
    description: "EMS VC Count",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_VCLOGGER`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const voiceState = message.member.voice;
        if (voiceState && voiceState.channel) {
            const channel = voiceState.channel;
            const members = channel.members;

            const embed = new EmbedBuilder()
                .setTitle(`Members in ${channel.name}`)
                .setDescription(members.map(member => member.displayName).join('\n'))
                .setColor('Red');

            message.channel.send({ embeds : [embed] });
        } else {
            message.reply('You need to be in a voice channel to use this command.');
        }
    }
};