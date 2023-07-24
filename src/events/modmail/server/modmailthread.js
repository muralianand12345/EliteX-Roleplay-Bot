const {
    Events,
} = require('discord.js');

const modMailModel = require("../../../events/mongodb/modals/modmail.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (message.author.bot) return;
        if (message.author.id === client.user.id) return;

        const modTMailData = await modMailModel.findOne({
            threadID: message.channel.id
        });

        if (modTMailData) {
            if (modTMailData.status == true) {
                const userID = modTMailData.userID;
                const user = await client.users.fetch(userID);

                if (user) {
                    await user.send({ content: `**Iconic RP Staff**: ${message.content}` }).then(() => {
                        message.react('✅');
                    }).catch((err) => {
                        message.react('❌');
                        console.error(err);
                    });
                }

                if (message.attachments) {
                    await message.attachments.forEach(async (value, key) => {
                        var media = value['url'];
                        await user.send({ content: `${media}` }).then(() => {
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