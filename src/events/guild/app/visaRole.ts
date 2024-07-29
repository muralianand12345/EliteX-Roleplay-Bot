import { Events, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, TextChannel, Interaction, ButtonInteraction, ModalSubmitInteraction, Client, User } from 'discord.js';
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { BotEvent } from "../../../types";

const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    model: "llama3-groq-70b-8192-tool-use-preview",
});

const handleVisaApplication = async (interaction: ButtonInteraction, client: Client) => {
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
};

const handleVisaApplicationSubmission = async (interaction: ModalSubmitInteraction, client: Client) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const applicationChannel = client.channels.cache.get(client.config.visaform.channels.immigration) as TextChannel;
        let applicationContent = '';
        for (const field of client.config.visaform.form) {
            const answer = interaction.fields.getTextInputValue(field.id);
            applicationContent += `${field.question}: ${answer}\n\n`;
        }
        const aiReview = await aiReviewApplication(applicationContent);
        const review = JSON.parse(aiReview);

        const applicationEmbed = createApplicationEmbed(interaction, client, review);
        const actionRow = createActionRow();

        await applicationChannel.send({ embeds: [applicationEmbed], components: [actionRow] });

        if (interaction.deferred) {
            await interaction.editReply({ content: 'Your application has been submitted successfully!' });
        } else {
            await interaction.reply({ content: 'Your application has been submitted successfully!', ephemeral: true });
        }

    } catch (error) {
        await handleError(interaction, client, 'Failed to submit visa application', error);
    }
};

const handleVisaDecision = async (interaction: ButtonInteraction, client: Client, isAccepted: boolean) => {
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
};

const createApplicationEmbed = (interaction: ModalSubmitInteraction, client: Client, aiReview: any) => {
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

    applicationEmbed.addFields({ 
        name: 'AI Review',
        value: `**Status:** ${aiReview.status}\n**Reason:** ${aiReview.reason}\n**Points:** ${aiReview.points}/10` 
    });

    return applicationEmbed;
};

const createActionRow = () => {
    const acceptButton = new ButtonBuilder()
        .setCustomId('visa-application-accept')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
        .setCustomId('visa-application-reject')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, rejectButton);
};

const createDecisionEmbed = (user: User, isAccepted: boolean, client: Client) => {
    return new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setTitle(`Visa Application ${isAccepted ? 'Accepted' : 'Rejected'}`)
        .setColor(isAccepted ? 'Green' : 'Red')
        .setDescription(isAccepted ?
            'Your visa application has been accepted! Please join the waiting hall <#1264167095445360763> for voice process. You will be called in the announcement channel <#1264166369935753227> when it\'s your turn.' :
            'We regret to inform you that your visa application has been rejected. Please review your application, ensure you have answered all questions in detail and reapply.')
        .setFooter({ text: client.user?.username || 'Iconic RP' })
        .setTimestamp();
};

const handleError = async (interaction: Interaction, client: Client, message: string, error: any) => {
    client.logger.error(`${message} | ${error}`);
    if (interaction.isRepliable()) {
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: `${message}. Please try again later.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `${message}. Please try again later.`, ephemeral: true });
            }
        } catch (replyError) {
            client.logger.error('Failed to send error message to user:', replyError);
        }
    }
};

const aiReviewApplication = async (application: string): Promise<string> => {
    const SYSTEM_PROMPT: string = `
        You are a visa application reviewer for a roleplay server named "Iconic Roleplay".
        Your primary function is to review user's visa applications and choose to approve or deny them.
        
        **Application Review Guidelines**:
            - The application should not have any empty fields.
            - The application backstory should be meaningful and not contain any inappropriate content.
            - If the application contains any inappropriate content, you should deny it.
            - If the user's application backstory is good, you should approve it.
            - The application can be any language, but it should be understandable.
            - The backstory should be at least 150 words long.
            - The user's Ingame name should be a valid name.
            - The user's backstory should not contain words like multiple "-" or "===" or "___" or any worlds to bypass the word limit.
        
        **Note**:
            - Your response should be a JSON object with the following keys:
                - "status": "approved" or "denied"
                - "reason": "Your reason for approving or denying the application within 120 characters"
                - "points": "The number of points you want to award the user out of 10"
            - Response should not have any empty fields or invalid values.
            - Your response should not contain any introduction or any other introductory text.
            - Dont be too strict, but also dont be too lenient.

        **Example Response**:
            "status": "approved",
            "reason": "Very well explained and detailed backstory, still room for improvement",
            "points": 8
    `;

    try {
        const prompt = ChatPromptTemplate.fromMessages([
            ['system', SYSTEM_PROMPT],
            ['human', '{input}']
        ]);
    
        const chain = prompt.pipe(llm);
        const result = await chain.invoke({ input: `${application}` });

        let response: string;
        if (typeof result.content === 'string') {
            response = result.content;
        } else if (Array.isArray(result.content)) {
            response = result.content.map(item => 
                typeof item === 'string' ? item : JSON.stringify(item)
            ).join(' ');
        } else {
            response = JSON.stringify(result.content);
        }

        const parsedResponse = JSON.parse(response);
        if (!parsedResponse.status || !parsedResponse.reason || !parsedResponse.points) {
            throw new Error('Invalid AI response format');
        }
    
        return response;
    } catch (error) {
        return JSON.stringify({
            status: "denied",
            reason: "Unable to process application due to technical issues",
            points: 0
        });
    }
};

const event: BotEvent = {
    name: Events.InteractionCreate,
    execute: async (interaction: Interaction, client: Client) => {
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

export default event;