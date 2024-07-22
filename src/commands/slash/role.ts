import { GuildMember, SlashCommandBuilder, WebhookClient, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
    cooldown: 1000,
    owner: false,
    botPerms: ['ManageRoles'],
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Assign or remove a role from a user.')
        .setDMPermission(false)
        .addStringOption(option => option
            .setName('role-name')
            .setDescription('The role name to assign or remove.')
            .setRequired(true)
            .addChoices(
                { name: 'Visa Holder', value: 'visa-holder' },
                { name: 'Townfolks', value: 'townfolks' },
            )
        )
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to assign or remove the role from.')
            .setRequired(true)
        ),
    async execute(interaction, client) {
        if (!interaction.guild) return;

        await interaction.deferReply({ ephemeral: true });

        const config_role = client.config.role_command;

        if (!config_role) return interaction.editReply({ content: 'Role configuration not found.' });
        if (!config_role.enabled) return interaction.editReply({ content: 'Role command is disabled.' });

        const roleName = interaction.options.getString('role-name', true);
        const executor = interaction.member as GuildMember;
        if (!executor) return interaction.editReply({ content: 'Executor member not found.' });

        if (!executor.roles.cache.some(role => config_role.admin_roles.includes(role.id))) {
            return interaction.editReply({ content: 'You do not have permission to use this command.' });
        }

        const webhook = new WebhookClient({ url: config_role.log_webhook });

        const targetUser = interaction.options.getUser('user', true);
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) return interaction.editReply({ content: 'Target member not found.' });

        const handleRole = async (roleId: string, communityRoleId?: string) => {
            const role = interaction.guild?.roles.cache.get(roleId);
            if (!role) return interaction.editReply({ content: 'Role not found.' });

            let action: 'Removed' | 'Added';
            if (targetMember.roles.cache.has(role.id)) {
                await targetMember.roles.remove(role);
                action = 'Removed';
            } else {
                await targetMember.roles.add(role);
                action = 'Added';
                if (communityRoleId) {
                    const communityRole = interaction.guild?.roles.cache.get(communityRoleId);
                    if (communityRole) await targetMember.roles.remove(communityRole);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(action === 'Added' ? 0x00FF00 : 0xFF0000)
                .setTitle(`Role ${action}`)
                .addFields(
                    { name: 'Executor', value: executor.user.tag, inline: true },
                    { name: 'Target User', value: targetUser.tag, inline: true },
                    { name: 'Role', value: role.name, inline: true },
                    { name: 'Action', value: action, inline: true },
                    { name: 'Time', value: new Date().toUTCString(), inline: true }
                )
                .setTimestamp();

            await webhook.send({ embeds: [embed] });

            return interaction.editReply({ content: `${action} the role ${role.name} ${action === 'Added' ? 'to' : 'from'} ${targetUser.username}.` });
        };

        switch (roleName) {
            case 'visa-holder':
                return handleRole(config_role.roles['visa-holder'], config_role.roles['community']);
            case 'townfolks':
                return handleRole(config_role.roles['townfolks']);
            default:
                return interaction.editReply({ content: 'Invalid role name.' });
        }
    }
};

export default command;