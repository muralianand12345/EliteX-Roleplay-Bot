import { GuildMember, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import jobApplicationSchema from '../../events/database/schema/jobApplication';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
    cooldown: 1000,
    owner: false,
    botPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('jobstatus')
        .setDescription('Check user\'s job application status.')
        .setDMPermission(false)
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to check.')
            .setRequired(true)
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return await interaction.editReply({ content: 'This command can only be used in servers.' });

        const config_job = client.config.job;

        if (!config_job?.enabled) return interaction.editReply({ content: 'Job application system is disabled.' });
        if (!config_job.application?.enabled) return interaction.editReply({ content: 'Job application system is currently disabled.' });

        const int_user = interaction.member as GuildMember;
        const ecpdJob = config_job.application.jobtype.find((job: any) => job.name === 'ECPD');
        const isECPDHead = ecpdJob && int_user.roles.cache.has(ecpdJob.head);
        const hasPermission = config_job.application.jobtype.some((job: any) => int_user.roles.cache.has(job.head));

        if (!hasPermission) return interaction.editReply({ content: 'You do not have the required role to use this command.' });

        const user = interaction.options.getUser('user');
        if (!user) return interaction.editReply({ content: 'User not found.' });

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply({ content: 'User is not a member of this server.' });

        const jobData = await jobApplicationSchema.findOne({ userId: member.id });
        if (!jobData) return interaction.editReply({ content: 'User has not submitted any job applications.' });

        let relevantApplications = jobData.data;
        if (isECPDHead) {
            relevantApplications = jobData.data.filter(app => app.jobName === 'ECPD');
        }

        if (relevantApplications.length === 0) {
            return interaction.editReply({ content: `User has not submitted any${isECPDHead ? ' ECPD' : ''} job applications.` });
        }

        const applicationDetails = relevantApplications.map((data, index) => {
            return `${index + 1}. **${data.jobName}**\n   Status: ${data.status || 'Pending'}\n   Applied: ${data.timestamp.toLocaleString()}\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`${isECPDHead ? 'ECPD ' : ''}Job Application Status for ${member.user.tag}`)
            .setColor('Blue')
            .addFields(
                { name: 'User ID', value: member.id, inline: true },
                { name: 'Accepted Applications', value: jobData.accepted ? 'Yes' : 'No', inline: true },
                { name: 'Total Applications', value: relevantApplications.length.toString(), inline: true },
                { name: 'Application Details', value: applicationDetails.join('\n') }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};

export default command;