const {
    Events
} = require('discord.js');

const {
    EmbedBuilder
} = require("discord.js");

const appCountModal = require('../../../events/mongodb/modals/applicationcount.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (client.config.ENABLE.DARKCHAT == false) return;
        if (message.channel.id == client.config.DARKCHAT.CHAN) {

            if (message.author.bot) return;
            var msg = message.content;

            var appCount = await appCountModal.findOne({
                guildID: message.guild.id,
            }).catch((err) => console.error(err));

            if (!appCount) {
                appCount = new appCountModal({
                    guildID: message.guild.id,
                    darkChatCount: 0
                });
                await appCount.save();
            }

            if (msg.includes('@here') || msg.includes('@everyone')) {

                await message.delete();
                return await message.channel.send({ content: "Cannot mention everyone or here" }).then(msg => {
                    setTimeout(() => {
                        msg.delete();
                    }, 4000);
                });
            }

            if (msg.length === 3 ) return await message.delete();

            if (msg.toLowerCase() === 'hi' || 
            msg.toLowerCase() === 'hello' || 
            msg.toLowerCase() === '.',
            msg.toLowerCase().includes('test')) {
                await message.delete();
                return;
            }

            const webhooks = await message.channel.fetchWebhooks();
            const webhook = webhooks.find(wh => wh.token);

            if (!webhook) return;

            const logChan = await client.channels.cache.get(client.config.DARKCHAT.LOG);

            const logEmbed = new EmbedBuilder()
                .addFields(
                    { name: 'User', value: `<@${message.author.id}>` },
                    { name: 'Message', value: `${msg}` }
                )

            await logChan.send({
                embeds: [logEmbed]
            });

            appCount.darkChatCount += 1;
            await appCount.save();

            await webhook.send({
                content: `${msg}`,
                username: `Anon Msg ${appCount.darkChatCount}`,
                avatarURL: 'https://thumbs.dreamstime.com/b/illegal-stamp-illegal-round-grunge-stamp-illegal-sign-illegal-136960672.jpg',
            });

            await message.delete();
        }
    }
}