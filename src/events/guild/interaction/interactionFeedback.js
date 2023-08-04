const {
    Events,
    Collection,
    WebhookClient
} = require('discord.js');
//Modals
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
//Embed and Buttons
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
require("dotenv").config();
const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var FeedbackEmbed = new EmbedBuilder();
        var FeedbackButton = new ActionRowBuilder();

        if (interaction.customId == "feedback-button") {

            if (cooldown.has(interaction.user.id)) {
                return interaction.reply({ content: `You are on a cooldown!`, ephemeral: true });
            } else {

                const feedbackModal = new ModalBuilder()
                    .setCustomId('feedback-modal')
                    .setTitle('Feedback/Suggestion Form');

                const IcName = new TextInputBuilder()
                    .setCustomId('feedback-icname')
                    .setLabel('What is your IC name?')
                    .setMaxLength(30)
                    .setMinLength(3)
                    .setStyle(TextInputStyle.Short);

                const Feedback = new TextInputBuilder()
                    .setCustomId('feedback-content')
                    .setLabel('Your feedback or suggestions!')
                    .setMaxLength(1000)
                    .setMinLength(20)
                    .setStyle(TextInputStyle.Paragraph);


                const firstActionRow = new ActionRowBuilder().addComponents(IcName);
                const secondActionRow = new ActionRowBuilder().addComponents(Feedback);

                feedbackModal.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(feedbackModal);

                cooldown.set(interaction.user.id);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, client.feedback.TIME);
            }
        }

        if (interaction.customId == "feedback-modal") {

            const FBIcName = interaction.fields.getTextInputValue('feedback-icname');
            const FBContent = interaction.fields.getTextInputValue('feedback-content');

            FeedbackEmbed.setColor('Blurple')
                .setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Name', value: `${FBIcName}` },
                    { name: 'Feedback/Suggestions', value: `${FBContent}` },
                )
                .setFooter({ text: `${interaction.user.id}` });

            FeedbackButton.addComponents(
                new ButtonBuilder()
                    .setCustomId('feedback-reply')
                    .setLabel('Reply')
                    .setStyle(ButtonStyle.Success),
            );

            await client.channels.cache.get(client.feedback.CHAN).send({
                embeds: [FeedbackEmbed],
                components: [FeedbackButton]
            }).then(async (msg) => {
                const emojiIds = client.feedback.EMOJI;
                for (let i = 0; i < emojiIds.length; i++) {
                    await msg.react(emojiIds[i % emojiIds.length]);
                }
                return interaction.reply({ content: 'Your feedback/suggestion recieved successfully!', ephemeral: true });
            });
        }

        if (interaction.customId == "feedback-reply") {
            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;

            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) {
                return await interaction.editReply({ content: 'No user!', ephemeral: true });
            }

            const feedbackReplyModal = new ModalBuilder()
                .setCustomId('feedback-reply-modal')
                .setTitle('Reply User');
            const Reply = new TextInputBuilder()
                .setCustomId('feedback-reply-modal-reply')
                .setLabel('Response')
                .setPlaceholder('Your reply to the user')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            const firstActionRow = new ActionRowBuilder().addComponents(Reply);
            feedbackReplyModal.addComponents(firstActionRow);
            await interaction.showModal(feedbackReplyModal);
        }

        if (interaction.customId == "feedback-reply-modal") {
            const Web = process.env.FEEDBACKWEB;
            const webhookClient = new WebhookClient({ url: Web });
            await interaction.deferReply({ ephemeral: true });
            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;

            const userMember = interaction.guild.members.cache.get(userId);
            const Reply = interaction.fields.getTextInputValue('feedback-reply-modal-reply');

            const embedReply = new EmbedBuilder()
                .setAuthor({ name: 'FeedBack Reply', iconURL: client.user.displayAvatarURL() })
                .setColor('Green')
                .setDescription(`${Reply}`);

            const editButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('feedback-reply')
                        .setLabel('Reply')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                );

            await interaction.message.edit({ components: [editButton] });
            webhookClient.send({
                content: `To: <@${userMember.id}>\n\`\`\`${Reply}\`\`\``,
                username: `${interaction.user.username}`,
                avatarURL: `${interaction.user.displayAvatarURL()}`,
            });
            await userMember.send({
                //content: `${Reply}`,
                embeds: [embedReply]
            }).catch(async (err) => {
                if (err.code == 50007) return await interaction.editReply({ content: 'User DM Blocked/Unable to DM!', ephemeral: true });
                console.log(`Feedback ERR: ${err}`);
            });
            return await interaction.editReply({ content: 'Reply Sent!', ephemeral: true });
        }
    }
};