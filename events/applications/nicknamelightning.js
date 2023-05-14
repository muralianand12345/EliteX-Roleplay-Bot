const {
    EmbedBuilder,
    Events
} = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        /*const guildId = '1058682553898381343';
        const userId = '852574003846840381';
        const nickname = 'LIGHTNING⚡';
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return;
        }
        const member = await guild.members.fetch(userId);
        if (!member) return;
        setInterval(async() => {
            if (member.displayName !== nickname) {
                await member.setNickname(nickname);
            }
        }, 20000)*/
    }
}