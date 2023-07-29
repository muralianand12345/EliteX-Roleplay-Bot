const {
    EmbedBuilder
} = require("discord.js");

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

        async function logEmbedSend(command, channelId, userId, msg) {
            const logEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`Command \`+msg ${command} ${msg}\``)
                .addFields(
                    { name: 'Client', value: `<@${userId}>` },
                    { name: 'Target Channel', value: `<#${channelId}>` },
                )

            await client.channels.cache.get(client.config.MSG.LOG.CHAN).send({
                embeds: [logEmbed]
            });
        }

        if (!chan) {
            chan = message.channel;
            msg = args.join(" ");
            //return message.reply({ content: 'Channel name is not specified or tagged!'});
        } else {
            msg = args.slice(1).join(" ");
        }

        if (!msg) return message.reply({ content: 'No message!' });

        if (msg.length > 1500) {
            const chunks = msg.match(/[\s\S]{1,1500}/g);

            try {
                for (const chunk of chunks) {
                    await chan.send({ content: chunk });
                }
                await logEmbedSend('message', chan.id, message.author.id, msg);
            } catch (error) {
                console.error(error);
                message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
            }
        } else {
            try {
                await chan.send({ content: `${msg}` });
                await logEmbedSend('message', chan.id, message.author.id, msg);
            } catch (error) {
                console.error(error);
                message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
            }
        }
        await message.delete();
    }
}