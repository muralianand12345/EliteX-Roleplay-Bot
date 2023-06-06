const {
    Events,
    ActivityType
} = require('discord.js');

module.exports = {
    name: Events.PresenceUpdate,
    async execute(oldMember, newMember, client) {

        const streamingRoleID = '1114625520005554236';
        const member = newMember.member;
        if (member.user.bot) return;
        if (newMember.guild.id == "1097455021228044328") {
            const nowStreamingRole = newMember.guild.roles.cache.find(role => role.id === streamingRoleID);
            const isStreamingOnYouTube = newMember.activities.some(activity =>
                activity.type === ActivityType.Streaming && activity.name.toLowerCase().includes('youtube')
            );

            if (isStreamingOnYouTube) {
                if (member.roles.cache.has(streamingRoleID)) return;
                member.roles.add(nowStreamingRole)
                    .then(() => console.log(`Assigned "Now Streaming" role to ${member.user.tag}`))
                    .catch(console.error);
            } else {
                if (!member.roles.cache.has(streamingRoleID)) return;
                member.roles.remove(nowStreamingRole)
                    .then(() => console.log(`Removed "Now Streaming" role from ${member.user.tag}`))
                    .catch(console.error);
            }
        }
    }
}