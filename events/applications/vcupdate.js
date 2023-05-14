const {
    Events,
    ChannelType
} = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    execute: async (client) => {

        const channelId = '1106932937129201725';
        const intervalTime = 1 * 60 * 1000;

        const channel = client.channels.cache.get(channelId);
        if (!channel || channel.type !== ChannelType.GuildVoice) return console.log(`Error: Voice channel with ID ${channelId} not found!`);

        setInterval(() => {
            const members = channel.guild.members.cache.filter(member => !member.user.bot);
            const memberCount = members.size;
            channel.setName(`Total Members: ${memberCount}`);
        }, intervalTime);
    }
}