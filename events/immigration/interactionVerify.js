const {
    Events,
    ComponentType
} = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        async function Roles(userId, role, roleId) {
            const info = await interaction.guild.members.fetch(userId);
            const roleInfo = await interaction.guild.roles.cache.find(x => x.id === roleId);

            if (role === 'add') {
                await info.roles.add(roleInfo);
            } else if (role === 'remove') {
                await info.roles.remove(roleInfo);
            }

        }

        const CRoleID = client.immigration.VERIFY.CROLE;
        const VRoleID = client.immigration.VERIFY.VROLE;

        if (interaction.customId == "verify-button") {
            if (interaction.member.roles.cache?.has(VRoleID)) {
                interaction.reply({ content: "Access Denied!", ephemeral: true });
            } else if (interaction.member.roles.cache?.has(CRoleID)) {
                interaction.reply({ content: "Access Denied!", ephemeral: true });
            } else {
                await Roles(interaction.user.id, 'add', CRoleID);
                interaction.reply({ content: "verified!", ephemeral: true });
            }
        }
    }
}