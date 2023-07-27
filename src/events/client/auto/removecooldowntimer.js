const { Events } = require('discord.js');
const blockUserModel = require("../../../events/mongodb/modals/blockusers.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        async function checkExpiredCooldown() {
            const currentTime = new Date();

            const expiredCooldown = await blockUserModel.find({
                expirationDate: { $lt: currentTime }
            });

            for (const cooldownData of expiredCooldown) {
                const guild = client.guilds.cache.get(cooldownData.guildId);
                if (!guild) continue;

                const member = guild.members.cache.get(cooldownData.userId);
                if (!member) continue;

                try {
                    await member.roles.remove(cooldownData.roleId);
                    cooldownData.block = false;
                    cooldownData.expirationDate = null;
                    await cooldownData.save();
                } catch (error) {
                    console.error(
                        `Error while removing cooldown from user ${member.user.tag} in guild ${guild.name}: ${error}`
                    );
                }
            }
        }

        setInterval(checkExpiredCooldown, 60 * 1000);
    }
};