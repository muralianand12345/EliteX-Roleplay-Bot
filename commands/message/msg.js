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
        await message.delete().then(async()=> {
            await chan.send({ content: `${msg}` });
        });
    }
}