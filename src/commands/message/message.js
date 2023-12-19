const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: 'msg',
    description: "Sends a message to a channel.",
    cooldown: 1000,
    owner: false,
    userPerms: ['ModerateMembers'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        var chan = message.mentions.channels.first();
        var msg;

        async function logEmbedSend(command, channelId, userId, msg) {
            const logEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`Command \`${client.config.bot.prefix}msg ${command} ${msg}\``)
                .addFields(
                    { name: 'Client', value: `<@${userId}>` },
                    { name: 'Target Channel', value: `<#${channelId}>` },
                )

            await client.channels.cache.get(client.config.bot.logchan).send({
                embeds: [logEmbed]
            });
        }

        if (!chan) {
            chan = message.channel;
            msg = args.join(" ");
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
                client.logger.error(error);
                message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
            }
        } else {
            try {
                await chan.send({ content: `${msg}` });
                await logEmbedSend('message', chan.id, message.author.id, msg);
            } catch (error) {
                client.logger.error(error);
                message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
            }
        }
        await message.delete();
    }
}