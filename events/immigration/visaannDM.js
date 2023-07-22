const {
    Events
} = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        const ChanID = client.immigration.VPDM.VPCHAN;
        const roleId = client.immigration.VPDM.ROLE;

        if (message.channel.id === ChanID) {
            if (message.author.bot) {
                const role = message.guild.roles.cache.get(roleId);

                if (role) {
                    role.members.forEach(member => {
                        member.send(`${message.content}`)
                            .catch(err => {
                                if (err.code == 50007) return;
                                console.error(`Error sending message to ${member.user.tag}:`, err);
                            });
                    });
                }
            }
        }
    }
}