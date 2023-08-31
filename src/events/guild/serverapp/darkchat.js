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
            var MessageContent = message.content;
            var msg_prediction;

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

            //Filter
            if (MessageContent.includes('@here') || MessageContent.includes('@everyone')) {

                await message.delete();
                return await message.channel.send({ content: "Cannot mention everyone or here" })
                    .then(msg => {
                        setTimeout(() => {
                            msg.delete();
                        }, 4000);
                    });
            }

            if (MessageContent.length === 3) return await message.delete();


            //LOG
            await message.delete();

            const webhooks = await message.channel.fetchWebhooks();
            const webhook = webhooks.find(wh => wh.token);
            if (!webhook) return;

            const logChan = await client.channels.cache.get(client.config.DARKCHAT.LOG);

            const logEmbed = new EmbedBuilder()
                .addFields(
                    { name: 'User', value: `<@${message.author.id}>` },
                    { name: 'Message', value: `${MessageContent}` }
                )

            await logChan.send({ embeds: [logEmbed] });

            //API 
            await fetch(client.mod.DARKCHAT.APILINK, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MessageContent }),
            }).then((response) => response.json())
                .then((data) => {
                    msg_prediction = data.predicted_label;
                }).catch((error) => {
                    console.log(`Error: ${error}`);
                });

            if (msg_prediction === "informative") {

                appCount.darkChatCount += 1;
                await appCount.save();

                await webhook.send({
                    content: `${MessageContent}`,
                    username: `Anon Msg ${appCount.darkChatCount}`,
                    avatarURL: 'https://thumbs.dreamstime.com/b/illegal-stamp-illegal-round-grunge-stamp-illegal-sign-illegal-136960672.jpg',
                });

            } else {
                return await message.channel.send({ content: "Content Not Informative!" })
                    .then(msg => {
                        setTimeout(() => {
                            msg.delete();
                        }, 4000);
                    });
            }
        }
    }
}