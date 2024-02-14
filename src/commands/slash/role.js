const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    cooldown: 5000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Job Role | Only heads / managers can use this command')
        .addUserOption(options =>
            options.setName('user')
                .setDescription('User')
                .setRequired(true)
        ),
    async execute(interaction, client) {

        if (!client.config.jobrole.enabled) return interaction.reply({ content: 'Job Role is disabled', ephemeral: true });

        const user = interaction.options.getUser('user');

        if (user.bot) return interaction.reply({ content: 'You cannot assign a role to a bot', ephemeral: true });
        
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return interaction.reply({ content: 'User not found', ephemeral: true });

        const headRoles = client.config.jobrole.roles.map(role => role.head);
        if (!interaction.member.roles.cache.some(role => headRoles.includes(role.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        var embed = new EmbedBuilder()
            .setAuthor({ name: 'Role Assignment', iconURL: user.displayAvatarURL() })
            .setTimestamp();

        const headRole = headRoles.find(roleId => interaction.member.roles.cache.has(roleId));
        const assignedRole = client.config.jobrole.roles.find(role => role.head === headRole);

        if (!assignedRole) {
            embed.setColor('Red').setDescription('No role found for your current role');
            return await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        try {

            const roleObj = interaction.guild.roles.cache.get(assignedRole.role);

            if (!member.roles.cache.has(roleObj.id)) {
                await member.roles.add(roleObj);
                embed.setColor('Green').setDescription(`**Role assigned:** ${roleObj.name}\n**Assigned by:** ${interaction.user.tag}\n**Assigned to:** ${member.user.tag}`);
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            } else {
                await member.roles.remove(roleObj);
                embed.setColor('Green').setDescription(`**Role removed:** ${roleObj.name}\n**Removed by:** ${interaction.user.tag}\n**Removed from:** ${member.user.tag}`);
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
            await client.channels.cache.get(client.config.jobrole.logchannel).send({ embeds: [embed] });
        
        } catch (error) {
            client.logger.error("Error assigning role", error);
            embed.setColor('Red').setDescription('An error occurred while assigning the role');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
