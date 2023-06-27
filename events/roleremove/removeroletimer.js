const { Events } = require('discord.js');

const roleModel = require('../../events/models/roleremove.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        async function checkExpiredRoles() {
            const currentTime = new Date();

            const expiredRoles = await roleModel.find({
                expirationDate: { $lt: currentTime }
            });

            for (const roleData of expiredRoles) {
                const guild = client.guilds.cache.get(roleData.guildId);
                if (!guild) continue;

                const member = guild.members.cache.get(roleData.userId);
                if (!member) continue;

                const role = guild.roles.cache.get(roleData.roleId);
                if (!role) continue;

                try {
                    await member.roles.remove(roleData.roleId);
                    await roleModel.findByIdAndDelete(roleData._id);
                } catch (error) {
                    console.error(
                        `Error while removing role for user ${member.user.tag} in guild ${guild.name}: ${error}`
                    );
                }
            }
        }

        setInterval(checkExpiredRoles, 60 * 1000);
    }
};
