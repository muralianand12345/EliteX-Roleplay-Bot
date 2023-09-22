const { Events } = require("discord.js");
const statsModel = require('../../../events/mongodb/modals/serverStats.js');

module.exports = {
    name: Events.ClientReady,
    execute: async (client) => {
        const intervalTime = 5000;

        setInterval(async () => {
            const datas = await statsModel.find({}, 'chanID guildID totalMemberCount');
            for (const data of datas) {
                const chanID = data.chanID;
                const guildId = data.guildID;
                const channel = client.channels.cache.get(chanID);
                const guild = client.guilds.cache.get(guildId);
                const members = await guild.members.fetch();
                const memberCount = members.filter(member => !member.user.bot).size;

                if (data.totalMemberCount !== memberCount) {
                    try {
                        await channel.setName(`Total Members: ${memberCount}`);
                    } catch (err) {
                        console.error(`Error while updating member count for ${guild.name} (${guild.id}): ${err}`);
                    }

                    data.totalMemberCount = memberCount;
                    await data.save();
                }
            }
        }, intervalTime);
    }
};
