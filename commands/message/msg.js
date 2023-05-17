module.exports = {
    name: 'msg',
    description: "Sends user DM reply",
    cooldown: 1000,
    userPerms: ['ModerateMembers'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_MESSAGE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var chan = message.mentions.channels.first();
        var msg;
        
        if (!chan) {
            chan = message.channel;
            msg = args.join(" ");
            //return message.reply({ content: 'Channel name is not specified or tagged!'});
        } else {
            msg = args.slice(1).join(" ");
        }

        try {
            await message.delete();

            const MAX_MESSAGE_LENGTH = 500;
            if (msg.length <= MAX_MESSAGE_LENGTH) {
                await chan.send({ content: msg });
            } else {
                const chunks = msg.match(/.{1,500}/g);

                for (const chunk of chunks) {
                    await chan.send({ content: chunk });
                }
            }
        } catch (error) {
            console.error(error);
            message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
        }
    }
}