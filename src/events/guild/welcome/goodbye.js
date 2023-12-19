const {
    Events
} = require('discord.js');

const welcomeUserModal = require('../../database/modals/welcomeUser.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {

        if (!member.guild) return;
        if (!client.config.welcome.goodbyemsg.enabled) return;

        var welcomeUserData = await welcomeUserModal.findOne({
            guildId: member.guild.id
        });

        if (!welcomeUserData) return;

        const chan = welcomeUserData.goodbyeChanId;
        if (!chan) return;

        const msg = client.config.welcome.goodbyemsg.message
            .replace(/{user}/g, member.user.tag)
            .replace(/{usermention}/g, `<@${member.user.id}>`)
            .replace(/{userid}/g, member.user.id)
            .replace(/{server}/g, member.guild.name)
            .replace(/{membercount}/g, member.guild.memberCount);

        await client.channels.cache.get(chan).send({
            content: msg
        });
    }
}
