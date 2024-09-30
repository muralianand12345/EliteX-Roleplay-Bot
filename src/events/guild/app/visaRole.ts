import { Events, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, TextChannel, Interaction, ButtonInteraction, ModalSubmitInteraction, Client, User, ColorResolvable } from 'discord.js';
import VisaApplicationDBModal from '../../database/schema/visaApplication';
import { BotEvent } from "../../../types";

const handleVisaApplication = async (interaction: ButtonInteraction, client: Client) => {
    try {
        if (!interaction.guild || interaction.user.bot) return;
        if (!client.config.visaform.enabled) {
            return interaction.reply({ content: 'Visa Application Form is currently disabled!', ephemeral: true });
        }

        const existingApplication = await VisaApplicationDBModal.findOne({ userId: interaction.user.id });
        if (existingApplication && existingApplication.accepted) {
            return interaction.reply({ content: 'You already have an accepted visa application. You cannot create a new one.', ephemeral: true });
        }

        const visaApplicationModal = new ModalBuilder()
            .setCustomId('visa-application-modal')
            .setTitle('EliteX Visa Application Form');

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
};

const handleVisaApplicationSubmission = async (interaction: ModalSubmitInteraction, client: Client) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const applicationChannel = client.channels.cache.get(client.config.visaform.channels.immigration) as TextChannel;
        
        const applicationEmbed = createApplicationEmbed(interaction, client);
        const actionRow = createActionRow();

        const sentMessage = await applicationChannel.send({ embeds: [applicationEmbed], components: [actionRow] });

        const newApplicationData = {
            applicationId: sentMessage.id,
            timestamp: new Date(),
            user_response: client.config.visaform.form.map((field: any) => ({
                question: field.question,
                answer: interaction.fields.getTextInputValue(field.id)
            }))
        };

        const existingApplication = await VisaApplicationDBModal.findOne({ userId: interaction.user.id });

        if (existingApplication) {
            existingApplication.data.push(newApplicationData);
            await existingApplication.save();
        } else {
            const newApplication = new VisaApplicationDBModal({
                userId: interaction.user.id,
                accepted: false,
                data: [newApplicationData]
            });
            await newApplication.save();
        }

        await interaction.editReply({ content: 'Your application has been submitted successfully!' });

    } catch (error) {
        await handleError(interaction, client, 'Failed to submit visa application', error);
    }
};

const handleVisaDecision = async (interaction: ButtonInteraction, client: Client, decision: 'accept' | 'onhold' | 'reject') => {
    try {
        await interaction.deferUpdate();

        const footerText = interaction.message.embeds[0].footer?.text || '';
        const userId = footerText.split(' | ').pop();
        if (!userId) return;
        const user = await client.users.fetch(userId);
        if (!user) return;

        let channelId: string;
        let visaRoleId: string | undefined;
        let communityRoleId: string | undefined;

        switch (decision) {
            case 'accept':
                channelId = client.config.visaform.channels.accepted;
                visaRoleId = client.config.visaform.role.visa;
                communityRoleId = client.config.visaform.role.community;
                await VisaApplicationDBModal.findOneAndUpdate(
                    { userId: userId },
                    { $set: { accepted: true } },
                    { new: true }
                );
                break;
            case 'onhold':
                channelId = client.config.visaform.channels.onhold;
                break;
            case 'reject':
                channelId = client.config.visaform.channels.rejected;
                break;
        }

        const notificationChannel = client.channels.cache.get(channelId) as TextChannel;

        const embed = createDecisionEmbed(user, decision, client);

        try {
            await user.send({ embeds: [embed] });
            if (decision === 'accept' && visaRoleId && communityRoleId) {
                const guild = interaction.guild;
                const member = await guild?.members.fetch(userId);
                if (member) {
                    await member.roles.add(visaRoleId);
                    await member.roles.remove(communityRoleId);
                }
            }
        } catch (error) {
            client.logger.warn(`Failed to send DM to user ${user.tag}, they may have DMs disabled. | Visa Application`);
            await notificationChannel.send(`Failed to send ${decision} notification DM to ${user.tag}. They may have DMs disabled.`);
        }

        await notificationChannel.send({ embeds: [embed] });

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setFooter({ text: `${decision.charAt(0).toUpperCase() + decision.slice(1)} by ${interaction.user.username} | ${userId}` });
        
        let updatedActionRow;
        switch (decision) {
            case 'accept':
            case 'reject':
                updatedActionRow = createActionRow(true, true, true);
                break;
            case 'onhold':
                updatedActionRow = createActionRow(false, true, false);
                break;
        }

        await interaction.editReply({
            embeds: [updatedEmbed],
            components: [updatedActionRow]
        });
    } catch (error) {
        await handleError(interaction, client, `Failed to process ${decision} for visa application`, error);
    }
};

const createApplicationEmbed = (interaction: ModalSubmitInteraction, client: Client) => {
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
};

const createActionRow = (acceptDisabled: boolean = false, onHoldDisabled: boolean = false, rejectDisabled: boolean = false) => {
    const acceptButton = new ButtonBuilder()
        .setCustomId('visa-application-accept')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setDisabled(acceptDisabled);

    const onHoldButton = new ButtonBuilder()
        .setCustomId('visa-application-onhold')
        .setLabel('On Hold')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(onHoldDisabled);

    const rejectButton = new ButtonBuilder()
        .setCustomId('visa-application-reject')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(rejectDisabled);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, onHoldButton, rejectButton);
};

const createDecisionEmbed = (user: User, decision: 'accept' | 'onhold' | 'reject', client: Client) => {
    let title;
    let color: ColorResolvable;
    let description: string;

    switch (decision) {
        case 'accept':
            title = 'Congratulations! Visa Application Accepted';
            break;
        case 'onhold':
            title = 'Visa Application Under Review';
            break;
        case 'reject':
            title = 'Visa Application Rejected';
            break;
        default:
            title = 'Visa Application Decision';
            break;
    }

    switch (decision) {
        case 'accept':
            color = 'Green';
            description = 'Your visa application has been accepted! You have been given the visa role. Welcome to EliteX RP! Hope you have a great time here.\nKeep watching <#1273689837030867024> for the updates.\nHappy Roleplaying!';
            break;
        case 'onhold':
            color = 'Yellow';
            description = 'Your visa application is currently under review. Please join the waiting hall <#1273994252019437659> for voice processing. You will be called in the announcement channel <#1273993959382978580> when it\'s your turn. After the voice process, your application will be either accepted or rejected.';
            break;
        case 'reject':
            color = 'Red';
            description = 'We regret to inform you that your visa application has been rejected. Please review your application, ensure you have answered all questions in detail and reapply.';
            break;
    }

    return new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setTitle(title)
        .setColor(color)
        .setDescription(description)
        .setFooter({ text: client.user?.username || 'EliteX RP' })
        .setTimestamp();
};

const handleError = async (interaction: Interaction, client: Client, message: string, error: any) => {
    client.logger.error(`${message} | ${error}`);
    if (interaction.isRepliable()) {
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: `${message}. Please try again later.` });
            } else if (!interaction.replied) {
                await interaction.reply({ content: `${message}. Please try again later.`, ephemeral: true });
            }
        } catch (replyError) {
            client.logger.error('Failed to send error message to user:');
            client.logger.error(replyError);
        }
    }
};

const event: BotEvent = {
    name: Events.InteractionCreate,
    execute: async (interaction: Interaction, client: Client) => {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        try {
            if (interaction.customId === 'visa-application') {
                await handleVisaApplication(interaction as ButtonInteraction, client);
            } else if (interaction.customId === 'visa-application-modal') {
                await handleVisaApplicationSubmission(interaction as ModalSubmitInteraction, client);
            } else if (interaction.customId === 'visa-application-accept') {
                await handleVisaDecision(interaction as ButtonInteraction, client, 'accept');
            } else if (interaction.customId === 'visa-application-onhold') {
                await handleVisaDecision(interaction as ButtonInteraction, client, 'onhold');
            } else if (interaction.customId === 'visa-application-reject') {
                await handleVisaDecision(interaction as ButtonInteraction, client, 'reject');
            }
        } catch (error) {
            await handleError(interaction, client, 'An error occurred while processing the interaction', error);
        }
    }
};

export default event;