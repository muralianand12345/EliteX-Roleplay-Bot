const {
    Events,
    Collection
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
    ActionRowBuilder
} = require("discord.js");

const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var FeedbackEmbed = new EmbedBuilder();

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
                );

            await client.channels.cache.get(client.feedback.CHAN).send({
                embeds: [FeedbackEmbed]
            }).then(async (msg) => {
                const emojiIds = client.feedback.EMOJI;
                for (let i = 0; i < emojiIds.length; i++) {
                    await msg.react(emojiIds[i % emojiIds.length]);
                }
                return interaction.reply({ content: 'Your feedback/suggestion recieved successfully!', ephemeral: true });
            });
        }
    }
};