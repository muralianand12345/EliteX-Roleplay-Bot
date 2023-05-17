const {
    Events,
    ChannelType
} = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    execute: async (client) => {

        const channelId = client.config.VCUPDATE.VCCHAN;
        const guildId = client.config.VCUPDATE.GUILDID;

        const intervalTime = 5000;

        const guild = client.guilds.cache.get(guildId);
        const channel = client.channels.cache.get(channelId);
        if (!channel || channel.type !== ChannelType.GuildVoice) return console.log(`Error: Voice channel with ID ${channelId} not found!`);

        setInterval(() => {
            guild.members.fetch().then(members => {
                const memberCount = members.filter(member => !member.user.bot).size;
                channel.setName(`Total Members: ${memberCount}`);
            });
        }, intervalTime);
    }
}