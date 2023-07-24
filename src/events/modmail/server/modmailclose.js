const {
    Events,
    Collection
} = require('discord.js');

//Embed and Buttons
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const cooldown = new Collection();

const modMailModel = require("../../../events/mongodb/modals/modmail.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "modmail-close") {

            const modMailData = await modMailModel.findOne({
                threadID: interaction.channel.id
            });

            if (modMailData) {
                if (modMailData.status == true) {
                    modMailData.status = false;
                    modMailData.threadID = null;
                    await modMailData.save();

                    await interaction.reply({ content: `🔒 ModMail Closed by ${interaction.user.username}` });
                    const userID = modMailData.userID;
                    const user = await client.users.fetch(userID);
                    if (user) {
                        await user.send({ content: `**Iconic RP Staff**: 🔒 The ModMail has been closed!` });
                    }
                }
            }

        }
    }
}