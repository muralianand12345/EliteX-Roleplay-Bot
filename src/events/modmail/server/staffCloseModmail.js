const {
    Events
} = require('discord.js');

const modmailUserModal = require('../../database/modals/modmailUser.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "modmail-close") {

            const modMailData = await modmailUserModal.findOne({
                threadID: interaction.channel.id
            });

            if (modMailData) {
                if (modMailData.status == true) {

                    const channelId = client.config.modmail.channelid;
                    const channel = client.channels.cache.get(channelId);
                    if (!channel) return client.logger.warn(`Channel not found with ID ${channelId}`);
                    const thread = channel.threads.cache.find(x => x.id === modMailData.threadID);

                    modMailData.status = false;
                    modMailData.threadID = null;
                    await modMailData.save();

                    await thread.setLocked(true).catch((err) => { return; });

                    await interaction.message.edit({ content: `🔒 ModMail Closed by ${interaction.user.username}`, components: [] });
                    const userID = modMailData.userID;
                    const user = await client.users.fetch(userID);
                    if (user) {
                        await user.send({ content: `**${client.config.modmail.staffname}**: 🔒 The ModMail has been closed!` });
                    }
                }
            }
        }
    }
}