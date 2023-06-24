const {
    Events,
} = require('discord.js');

const modMailModel = require("../../events/models/modmail.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (message.author.bot) return;
        if (message.author.id === client.user.id) return;

        const modMailData = await modMailModel.findOne({
            userID: message.author.id
        });

        if (modMailData) {
            if (modMailData.status == true) {

                const channelId = client.modmail.ForumChanID;
                const channel = client.channels.cache.get(channelId);
                if (!channel) return console.log(`Channel not found with ID ${channelId}`);
                const thread = channel.threads.cache.find(x => x.id === modMailData.threadID);

                await thread.send({ content: `**${message.author.username}**: ${message.content}` }).then(() => {
                    message.react('✅');
                }).catch((err) => {
                    message.react('❌');
                    console.error(err);
                });

                if (message.attachments) {
                    await message.attachments.forEach(async (value, key) => {
                        var media = value['url'];
                        await thread.send({ content: `${media}` }).then(() => {
                            message.react('✅');
                        }).catch((err) => {
                            message.react('❌');
                            console.error(err);
                        });
                    });
                }
            }
        }
    }
}