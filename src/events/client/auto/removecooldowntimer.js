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

                try {
                    cooldownData.block = false;
                    cooldownData.expirationDate = null;
                    await cooldownData.save();
                } catch (error) {
                    console.error(`Error while updating cooldown data for user with ID ${cooldownData.userId}: ${error}`);
                }
            }
        }
        setInterval(checkExpiredCooldown, 60 * 1000);
    }
};