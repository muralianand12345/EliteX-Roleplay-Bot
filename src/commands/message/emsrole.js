const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: 'emsrole',
    description: "EMS Role Count",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: [],
    run: async (client, message, args) => {

        const commandName = `MESS_EMSROLE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const roleID = '';
        const role = message.guild.roles.cache.find((r) => r.id === roleID);
        if (!role) {
            return message.reply(`The role "${roleName}" does not exist.`);
        }

        const allowedUserIDs = [
            ''
        ];

        const membersWithRole = Array.from(role.members.values());

        membersWithRole.forEach(async (member) => {
            if (!allowedUserIDs.includes(member.id)) {
                try {
                    //await member.roles.remove(role);
                    client.channels.cache.get('').send(`${member.user.tag} from the role ${roleID} | <@${member.user.id}>`)
                    //console.log(`${member.user.tag} from the role ${roleName}`);
                } catch (error) {
                    client.channels.cache.get('').send(`Failed to remove user ${member.user.tag} from the role ${roleID}: ${error}`)
                    //console.error(`Failed to remove user ${member.user.tag} from the role ${roleName}: ${error}`);
                }
            }
        });

    }
};