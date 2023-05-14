module.exports = {
    name: 'editmsg',
    description: "Sends user DM reply",
    cooldown: 1000,
    userPerms: ['ModerateMembers'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_EDITMSG`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const messageId = args[0];
        const text = args.slice(1).join(" ");
        let channel;

        try {
            const fetchedMessage = await message.channel.messages.fetch(messageId);
            channel = fetchedMessage.channel;
        } catch (error) {
            console.log(`Error: ${error}`);
            return message.reply({ content: 'Invalid message ID!' });
        }

        await message.delete();

        try {
            const fetchedMessage = await channel.messages.fetch(messageId);
            await fetchedMessage.edit(text);
        } catch (error) {
            console.log(`Error: ${error}`);
            return message.reply({ content: 'Failed to edit message!' });
        }
    }
}