const {
    Events
} = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {

        if (member.guild.id !== client.welcome.GUILDID) return;
        const chan = client.welcome.GOODBYECHAN;
        const msg = `\`${member.user.tag}\` **|** <@${member.user.id}> **Just Left The Server!!!**`;

        await client.channels.cache.get(chan).send({
            content: msg
        });
    }
}