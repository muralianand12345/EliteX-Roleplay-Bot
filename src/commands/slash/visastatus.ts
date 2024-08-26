import { GuildMember, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import visaApplicationSchema from '../../events/database/schema/visaApplication';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
    cooldown: 1000,
    owner: false,
    botPerms: ['ManageRoles'],
    data: new SlashCommandBuilder()
        .setName('visastatus')
        .setDescription('Check user\'s visa application status.')
        .setDMPermission(false)
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to check.')
            .setRequired(true)
        ),
    async execute(interaction, client) {

        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return await interaction.editReply({ content: 'This command can only be used in servers.' });

        const config_role = client.config.visaform;

        if (!config_role?.enabled) return interaction.editReply({ content: 'Visa command is disabled.' });
        if (!config_role?.role?.immigration) return interaction.editReply({ content: 'Immigration role not found.' });

        const int_user = interaction.member as GuildMember;
        if (!int_user.roles.cache.has(config_role.role.immigration)) return interaction.editReply({ content: 'You do not have the required role to use this command.' });

        const user = interaction.options.getUser('user');
        if (!user) return interaction.editReply({ content: 'User not found.' });

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply({ content: 'User is not a member of this server.' });

        const visaData = await visaApplicationSchema.findOne({ userId: member.id });
        if (!visaData) return interaction.editReply({ content: 'User has not submitted any visa application.' });

        const messageLinks = visaData.data.map((data) => 
            `[Application ${data.applicationId}](https://discord.com/channels/${interaction.guild?.id}/${config_role.channels.immigration}/${data.applicationId})`
        );

        const embed = new EmbedBuilder()
            .setTitle(`Visa Application Status for ${member.user.tag}`)
            .setColor('Blurple')
            .addFields(
                { name: 'User ID', value: member.id, inline: true },
                { name: 'Accepted', value: visaData.accepted ? 'Yes' : 'No', inline: true },
                { name: 'Application Count', value: visaData.data.length.toString(), inline: true },
                { name: 'Applications', value: messageLinks.join('\n') || 'No applications found' }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};

export default command;