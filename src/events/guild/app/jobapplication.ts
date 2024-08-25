import { Events, StringSelectMenuInteraction, Client, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ThreadChannel, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { BotEvent } from '../../../types';

const handleJobApplicationSelection = async (interaction: StringSelectMenuInteraction, client: Client) => {
    if (!client.config.job.application.enabled) return await interaction.reply({ content: 'Job application is currently disabled.', ephemeral: true });

    const selectedJobValue = interaction.values[0];
    const selectedJob = client.config.job.application.jobtype.find((job: any) => job.value === selectedJobValue);

    if (!selectedJob) {
        return await interaction.reply({ content: 'Invalid job selection.', ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId(`job-application-${selectedJobValue}`)
        .setTitle(`${selectedJob.name} Application`);

    const actionRows = selectedJob.form.map((question: any) => {
        const textInput = new TextInputBuilder()
            .setCustomId(question.id)
            .setLabel(question.question)
            .setStyle(question.style === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph)
            .setPlaceholder(question.placeholder)
            .setRequired(question.required)
            .setMinLength(question.min)
            .setMaxLength(question.max);

        return new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
    });

    modal.addComponents(...actionRows);

    await interaction.showModal(modal);
};

const handleModalSubmit = async (interaction: any, client: Client) => {
    const jobValue = interaction.customId.replace('job-application-', '');
    const selectedJob = client.config.job.application.jobtype.find((job: any) => job.value === jobValue);

    if (!selectedJob) {
        return await interaction.reply({ content: 'Invalid job application.', ephemeral: true });
    }

    const responseChannel = await client.channels.fetch(client.config.job.channel.response) as any;
    if (!responseChannel) return await interaction.reply({ content: 'Error: Response channel not found.', ephemeral: true });

    let thread = responseChannel.threads.cache.find((t: ThreadChannel) => t.name === selectedJob.name);
    if (!thread) {
        thread = await responseChannel.threads.create({
            name: selectedJob.name,
            autoArchiveDuration: 10080, // 7 days
            reason: `Thread for ${selectedJob.name} applications`
        }) as ThreadChannel;
    }

    const embed = new EmbedBuilder()
        .setTitle(`${selectedJob.name} Application`)
        .setDescription(`Applicant: ${interaction.user.tag}`)
        .setColor('Blue')
        .addFields(selectedJob.form.map((question: any) => ({
            name: question.question,
            value: interaction.fields.getTextInputValue(question.id) || 'No response provided'
        })))
        .setTimestamp();

    const acceptButton = new ButtonBuilder()
        .setCustomId(`acceptjobapplication-${interaction.user.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
        .setCustomId(`rejectjobapplication-${interaction.user.id}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(acceptButton, rejectButton);

    await thread.send({ embeds: [embed], components: [row] });

    await interaction.reply({ content: 'Your application has been submitted!', ephemeral: true });
};

const handleButtonInteraction = async (interaction: any, client: Client) => {
    try {
        console.log('Button interaction started');

        const [action, userId] = interaction.customId.split('-');
        console.log(`Action: ${action}, UserId: ${userId}`);

        const jobName = interaction.channel.name;
        console.log(`Job Name: ${jobName}`);

        const selectedJob = client.config.job.application.jobtype.find((job: any) => job.name === jobName);

        if (!selectedJob) {
            console.log('Job type not found');
            return await interaction.reply({ content: 'Error: Job type not found.', ephemeral: true });
        }

        console.log(`Selected Job: ${selectedJob.name}`);

        if (!interaction.member.roles.cache.has(selectedJob.head)) {
            console.log('User lacks permission');
            return await interaction.reply({ content: 'You do not have permission to perform this action.', ephemeral: true });
        }

        console.log('User has permission');

        const user = await client.users.fetch(userId);
        console.log(`User fetched: ${user.tag}`);

        const acceptRejectChannel = await client.channels.fetch(client.config.job.channel.acceptreject) as any;
        console.log(`Accept/Reject channel fetched: ${acceptRejectChannel.name}`);

        const isAccepted = action === 'acceptjobapplication';
        const status = isAccepted ? 'accepted' : 'rejected';

        const dmEmbed = new EmbedBuilder()
            .setTitle(`Job Application ${status.charAt(0).toUpperCase() + status.slice(1)}`)
            .setDescription(`Your application for ${jobName} has been ${status}.`)
            .setColor(isAccepted ? 'Green' : 'Red')
            .setTimestamp();

        if (isAccepted) {
            dmEmbed.addFields({ name: 'Next Steps', value: 'Please await further instructions from the hiring team.' });
        } else {
            dmEmbed.addFields({ name: 'Future Opportunities', value: 'We encourage you to apply for future positions that match your skills and interests.' });
        }

        console.log('Sending DM to user');
        await user.send({ embeds: [dmEmbed] });

        const channelEmbed = new EmbedBuilder()
            .setTitle(`Job Application ${status.charAt(0).toUpperCase() + status.slice(1)}`)
            .setDescription(`${user.tag}'s application for ${jobName} has been ${status}.`)
            .setColor(isAccepted ? 'Green' : 'Red')
            .addFields(
                { name: 'Applicant', value: user.tag },
                { name: 'Position', value: jobName },
                { name: 'Status', value: status.charAt(0).toUpperCase() + status.slice(1) }
            )
            .setTimestamp();

        console.log('Sending message to accept/reject channel');
        await acceptRejectChannel.send({ embeds: [channelEmbed] });

        console.log('Replying to interaction');
        await interaction.reply({ content: `Application ${status}.`, ephemeral: true });

        console.log('Editing original message');
        await interaction.message.edit({ components: [] });

        console.log('Button interaction completed successfully');
    } catch (error) {
        console.error('Error in handleButtonInteraction:', error);
        try {
            await interaction.reply({ content: 'An error occurred while processing the application. Please try again later.', ephemeral: true });
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
};

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu() && interaction.customId === 'job-applicationform-category') {
            await handleJobApplicationSelection(interaction, client);
        } else if (interaction.isModalSubmit() && interaction.customId.startsWith('job-application-')) {
            await handleModalSubmit(interaction, client);
        } else if (interaction.isButton() && (interaction.customId.startsWith('acceptjobapplication-') || interaction.customId.startsWith('rejectjobapplication-'))) {
            await handleButtonInteraction(interaction, client);
        }
    }
};

export default event;