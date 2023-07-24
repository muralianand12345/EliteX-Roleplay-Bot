const {
    EmbedBuilder,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const modMailModel = require("../../../events/mongodb/modals/modmail.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (message.author.bot) return;
        if (message.guild) return;

        const modMailData = await modMailModel.findOne({
            userID: message.author.id
        });

        if (!modMailData) {
            var modmail = new modMailModel({
                userID: message.author.id,
                status: false,
                threadID: null,
                count: 0
            });
            await modmail.save();
            return embedSend(message);
        }

        if (modMailData.status == false) return embedSend(message);

        async function embedSend(message) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: "Iconic RP ModMail" })
                .setDescription(`Hello <@${message.author.id}>! Click the below button to contact the staff members.\nYou can use this to ask doubts and questions (For reporting players kindly use the ticket system)`)
                .setFooter({ text: 'Click the button to get started!' })
            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('modmail-start')
                        .setEmoji('🎫')
                        .setLabel('Open ModMail')
                        .setStyle(ButtonStyle.Danger)
                )
            await message.reply({ embeds: [embed], components: [button] });
        }
    }
}