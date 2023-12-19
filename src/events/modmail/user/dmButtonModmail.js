const {
    Events
} = require('discord.js');

//Embed and Buttons
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const modmailUserModal = require('../../database/modals/modmailUser.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "modmail-modal") {

            const modMailData = await modmailUserModal.findOne({
                userID: interaction.user.id
            });

            if (modMailData) {
                if (modMailData.status == false) {
                    modMailData.status = true;
                    modMailData.count += 1;
                    await modMailData.save();

                    const Title = interaction.fields.getTextInputValue('modmail-modal-title') || "No Title";
                    const Description = interaction.fields.getTextInputValue('modmail-modal-description') || "No Description";

                    const channelId = client.config.modmail.channelid;
                    const channel = client.channels.cache.get(channelId);
                    if (!channel) return client.logger.warn(`Channel not found with ID ${channelId}`);

                    const thread = await channel.threads.create({
                        name: `ModMail - ${interaction.user.username}`,
                        autoArchiveDuration: 1440, // 24 hours (in minutes)
                        reason: 'ModMail Thread',
                    });

                    modMailData.threadID = thread.id;
                    await modMailData.save();

                    const embed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle(`**ModMail Thread | ${interaction.user.username}**`)
                        .setDescription(`UserName: <@${interaction.user.id}> | \`${interaction.user.id}\``)
                        .setFields(
                            { name: 'Title', value: `${Title}` },
                            { name: 'Description', value: `${Description}` }
                        )
                        .setFooter({ text: 'Send a Message to Reply!' });
                    const button = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('modmail-close')
                                .setEmoji('🔒')
                                .setLabel('Close')
                                .setStyle(ButtonStyle.Danger)
                        );

                    await thread.send({ embeds: [embed], components: [button] });
                    await interaction.user.send({ content: "⏳ Wait patiently for our staff to respond, you'll be notified here!" });
                    await interaction.reply({ content: 'ModMail Created!', ephemeral: true }).then(async () => {
                        await interaction.message.delete();
                    });
                }
            } else {
                return interaction.reply({ content: 'You already have a modmail opened! | If not contact the discord developer.', ephemeral: true });
            }
        }
    }
}