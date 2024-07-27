import { Events, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, TextChannel, Interaction, ButtonInteraction, ModalSubmitInteraction, Client, User } from 'discord.js';
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, client: Client) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId === 'visa-application') {
            await handleVisaApplication(interaction as ButtonInteraction, client);
        } else if (interaction.customId === 'visa-application-modal') {
            await handleVisaApplicationSubmission(interaction as ModalSubmitInteraction, client);
        } else if (interaction.customId === 'visa-application-accept') {
            await handleVisaDecision(interaction as ButtonInteraction, client, true);
        } else if (interaction.customId === 'visa-application-reject') {
            await handleVisaDecision(interaction as ButtonInteraction, client, false);
        }
    }
};

async function handleVisaApplication(interaction: ButtonInteraction, client: Client) {
    try {
        if (!interaction.guild || interaction.user.bot) return;
        if (!client.config.visaform.enabled) {
            return interaction.reply({ content: 'Visa Application Form is currently disabled!', ephemeral: true });
        }

        const visaApplicationModal = new ModalBuilder()
            .setCustomId('visa-application-modal')
            .setTitle('Iconic Visa Application Form');

        for (const field of client.config.visaform.form) {
            const inputField = new TextInputBuilder()
                .setCustomId(field.id)
                .setLabel(field.question)
                .setPlaceholder(field.placeholder || '')
                .setRequired(field.required)
                .setStyle(field.style === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph)
                .setMinLength(field.min)
                .setMaxLength(field.max);

            const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(inputField);
            visaApplicationModal.addComponents(actionRow);
        }

        await interaction.showModal(visaApplicationModal);
    } catch (error) {
        await handleError(interaction, client, 'Failed to create visa application modal', error);
    }
}

async function handleVisaApplicationSubmission(interaction: ModalSubmitInteraction, client: Client) {
    try {
        await interaction.deferUpdate();

        const applicationChannel = client.channels.cache.get(client.config.visaform.channels.immigration) as TextChannel;
        const applicationEmbed = createApplicationEmbed(interaction, client);
        const actionRow = createActionRow();

        await applicationChannel.send({ embeds: [applicationEmbed], components: [actionRow] });
        await interaction.editReply({ content: 'Your application has been submitted successfully!' });
    } catch (error) {
        await handleError(interaction, client, 'Failed to submit visa application', error);
    }
}

async function handleVisaDecision(interaction: ButtonInteraction, client: Client, isAccepted: boolean) {
    try {
        await interaction.deferUpdate();

        const userId = interaction.message.embeds[0].footer?.text;
        if (!userId) return;
        const user = await client.users.fetch(userId);
        if (!user) return;

        const channelId = isAccepted ? client.config.visaform.channels.accepted : client.config.visaform.channels.rejected;
        const notificationChannel = client.channels.cache.get(channelId) as TextChannel;

        const embed = createDecisionEmbed(user, isAccepted, client);

        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            client.logger.error(`Failed to send DM to user ${user.tag} | Visa Application`);
            await notificationChannel.send(`Failed to send ${isAccepted ? 'acceptance' : 'rejection'} DM to ${user.tag}. They may have DMs disabled.`);
        }

        await notificationChannel.send({ embeds: [embed] });
        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setFooter({ text: `${isAccepted ? 'Accepted' : 'Rejected'} by ${interaction.user.username} | ${interaction.user.id}` });
        await interaction.editReply({
            embeds: [updatedEmbed],
            components: []
        });
    } catch (error) {
        await handleError(interaction, client, `Failed to ${isAccepted ? 'accept' : 'reject'} visa application`, error);
    }
}

function createApplicationEmbed(interaction: ModalSubmitInteraction, client: Client) {
    const applicationEmbed = new EmbedBuilder()
        .setTitle('New Visa Application')
        .setColor('#0099ff')
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp()
        .setFooter({ text: interaction.user.id });

    for (const field of client.config.visaform.form) {
        const answer = interaction.fields.getTextInputValue(field.id);
        applicationEmbed.addFields({ name: field.question, value: answer });
    }

    return applicationEmbed;
}

function createActionRow() {
    const acceptButton = new ButtonBuilder()
        .setCustomId('visa-application-accept')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
        .setCustomId('visa-application-reject')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, rejectButton);
}

function createDecisionEmbed(user: User, isAccepted: boolean, client: Client) {
    return new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setTitle(`Visa Application ${isAccepted ? 'Accepted' : 'Rejected'}`)
        .setColor(isAccepted ? 'Green' : 'Red')
        .setDescription(isAccepted ?
            'Your visa application has been accepted! Please join the waiting hall <#1264167095445360763> for voice process. You will be called in the announcement channel <#1264166369935753227> when it\'s your turn.' :
            'We regret to inform you that your visa application has been rejected. Please review your application, ensure you have answered all questions in detail and reapply.')
        .setFooter({ text: client.user?.username || 'Iconic RP' })
        .setTimestamp();
}

async function handleError(interaction: Interaction, client: Client, message: string, error: any) {
    client.logger.error(`${message} | ${error}`);
    if (interaction.isRepliable()) {
        await interaction.reply({ content: `${message}. Please try again later.`, ephemeral: true });
    }
}

export default event;