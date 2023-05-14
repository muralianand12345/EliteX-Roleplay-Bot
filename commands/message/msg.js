module.exports = {
    name: 'msg',
    description: "Sends user DM reply",
    cooldown: 1000,
    userPerms: ['ModerateMembers'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_MESSAGE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const chan = message.mentions.channels.first();
        
        if (!chan) {
            return message.reply({ content: 'Channel name is not specified or tagged!'});
        }

        var msg = args.slice(1).join(" ");

        try {
            await message.delete();
            await chan.send({ content: `${msg}` });
        } catch (error) {
            console.error(error);
            message.reply({ content: 'An error occurred while sending the message. Please try again later.'});
        }
    }
}