const {
    Events,
} = require('discord.js');

const modmailUserModal = require('../../database/modals/modmailUser.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (!client.config.modmail.enabled) return;
        if (!message.guild) return;
        if (message.author.bot) return;
        if (message.author.id === client.user.id) return;
        
        const modTMailData = await modmailUserModal.findOne({
            threadID: message.channel.id
        });

        if (modTMailData) {
            if (modTMailData.status == true) {
                const userID = modTMailData.userID;
                const user = await client.users.fetch(userID);

                if (user) {
                    await user.send({ content: `**${client.config.modmail.staffname}**: ${message.content}` }).then(() => {
                        message.react('✅');
                    }).catch((err) => {
                        message.react('❌');
                        client.logger.error(err);
                    });
                }

                if (message.attachments) {
                    await message.attachments.forEach(async (value, key) => {
                        var media = value['url'];
                        await user.send({ content: `${media}` }).then(() => {
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