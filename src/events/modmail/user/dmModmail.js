const {
    Events,
} = require('discord.js');

const modmailUserModal = require('../../database/modals/modmailUser.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (!client.config.modmail.enabled) return;
        if (message.guild) return;
        if (message.author.bot) return;
        if (message.author.id === client.user.id) return;

        const modMailData = await modmailUserModal.findOne({
            userID: message.author.id
        });

        if (modMailData) {
            if (modMailData.status == true) {

                const channelId = client.config.modmail.channelid;
                const channel = client.channels.cache.get(channelId);
                if (!channel) return client.logger.warn(`Channel not found with ID ${channelId}`);
                const thread = channel.threads.cache.find(x => x.id === modMailData.threadID);

                if (thread) {
                    await thread.send({ content: `**${message.author.username}**: ${message.content}` }).then(() => {
                        message.react('✅');
                    }).catch((err) => {
                        message.react('❌');
                        client.logger.error(err);
                    });

                    if (message.attachments) {
                        await message.attachments.forEach(async (value, key) => {
                            var media = value['url'];
                            await thread.send({ content: `${media}` }).then(() => {
                                message.react('✅');
                            }).catch((err) => {
                                message.react('❌');
                                client.logger.error(err);
                            });
                        });
                    }
                }
            }
        }
    }
}