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
        const userJobRole = config_job.application.jobtype.find((job: any) => int_user.roles.cache.has(job.head));

        if (!userJobRole) return interaction.editReply({ content: 'You do not have the required role to use this command.' });

        const user = interaction.options.getUser('user');
        if (!user) return interaction.editReply({ content: 'User not found.' });

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply({ content: 'User is not a member of this server.' });

        const jobData = await jobApplicationSchema.findOne({ userId: member.id });
        if (!jobData) return interaction.editReply({ content: 'User has not submitted any job applications.' });

        const relevantApplications = jobData.data.filter(app => app.jobName === userJobRole.name);

        if (relevantApplications.length === 0) {
            return interaction.editReply({ content: `User has not submitted any ${userJobRole.name} job applications.` });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${userJobRole.name} Job Application Status`)
            .setColor('Blue')
            .setDescription(`Status for <@${member.id}> (${member.user.tag})`)
            .addFields(
                { name: 'Total Applications', value: relevantApplications.length.toString(), inline: true },
                { name: 'Latest Status', value: relevantApplications[relevantApplications.length - 1].status || 'Pending', inline: true }
            )
            .setTimestamp();

        const recentApplications = relevantApplications.slice(-5).reverse();
        const applicationHistory = recentApplications.map((app, index) => {
            const date = new Date(app.timestamp).toLocaleDateString();
            return `${recentApplications.length - index}. ${date} - ${app.status || 'Pending'}`;
        }).join('\n');

        embed.addFields({ 
            name: 'Recent Application History', 
            value: applicationHistory || 'No recent applications',
            inline: false
        });

        if (relevantApplications.length > 5) {
            embed.setFooter({ text: `Showing ${recentApplications.length} most recent out of ${relevantApplications.length} total applications` });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};

export default command;