const {
    EmbedBuilder
} = require("discord.js");

const roleModel = require('../../events/mongodb/modals/roleremove.js');

module.exports = {
    name: 'oocticket',
    description: "OOC Ticket role add and remove",
    cooldown: 1000,
    userPerms: [''],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_OOCTICKET`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        //function
        async function RoleLog(Job, type, TouserId, FromuserId, logchan) {
            const logembed = new EmbedBuilder()
                .setColor('#000000')
                .setDescription(`${Job} | Type: ${type}`)
                .addFields(
                    { name: 'To', value: `<@${TouserId}>` },
                    { name: 'By', value: `<@${FromuserId}>` }
                );

            await logchan.send({ embeds: [logembed] });
        }

        if (!message.member.roles.cache.has(client.ooc.TICKET)) return;

        //log
        const logChan = client.channels.cache.get(client.ooc.LOG);
        if (!logChan) return;

        //user
        var user = message.mentions.users.first();
        if (!user) return;
        if (user.bot) return message.reply('User cannot be a bot');
        const userMember = message.guild.members.cache.get(user.id);

        var option;
        //option
        if (args[1]) {
            option = args[1].toLowerCase();
        } else {
            option = null;
        }
        
        if (option == null) return;

        if (option == "ooc") {
            const role1 = message.guild.roles.cache.get(client.ooc.OOC);
            if (!role1) return;
            const role2 = message.guild.roles.cache.get(client.ooc.LIVE);
            if (!role2) return;
            if (userMember.roles.cache.has(client.ooc.VISA)) {
                if (!userMember.roles.cache.has(client.ooc.OOC)) {
                    await userMember.roles.add(role1);
                    await RoleLog('OOC Meet', 'ADD', userMember.id, message.author.id, logChan);
                    return message.delete();
                } else {
                    await userMember.roles.remove(role1);
                    await userMember.roles.remove(role2);
                    await RoleLog('OOC Meet', 'REMOVE', userMember.id, message.author.id, logChan);
                    return message.delete();
                }
            }
        }

        if (option == "visa") {

            const role1 = message.guild.roles.cache.get(client.ooc.OOC);
            if (!role1) return;
            const role2 = message.guild.roles.cache.get(client.ooc.VISA);
            if (!role2) return;
            const role3 = message.guild.roles.cache.get(client.ooc.COMMUNITY);
            if (!role3) return;
            const role4 = message.guild.roles.cache.get(client.ooc.AGE1);
            if (!role4) return;
            const role5 = message.guild.roles.cache.get(client.ooc.AGE2);
            if (!role5) return;
            const role6 = message.guild.roles.cache.get(client.ooc.LIVE);
            if (!role6) return;

            if (userMember.roles.cache.has(client.ooc.VISA)) {
                if (userMember.roles.cache.has(client.ooc.OOC)) {
                    await userMember.roles.remove(role1);
                    await userMember.roles.remove(role2);
                    await userMember.roles.add(role3);
                    await userMember.roles.remove(role4);
                    await userMember.roles.remove(role5);
                    await userMember.roles.remove(role6);
                    await RoleLog('VISA', 'REVOKE', userMember.id, message.author.id, logChan);
                    return message.delete();
                } else {
                    return message.reply('The user has no **OOC Meet** role');
                }
            } else {
                await userMember.roles.remove(role1);
                await userMember.roles.add(role2);
                await userMember.roles.remove(role3);
                await RoleLog('VISA', 'ADD', userMember.id, message.author.id, logChan);
                return message.delete();
            }
        }

        if (option == "live") {

            const role = message.guild.roles.cache.get(client.ooc.LIVE);
            if (!role) return;
            if (!userMember.roles.cache.has(client.ooc.LIVE)) {
                if (userMember.roles.cache.has(client.ooc.OOC)) {
                    await userMember.roles.add(role);
                    await RoleLog('LIVE', 'ADD', userMember.id, message.author.id, logChan);

                    const expirationDate = new Date(Date.now() + 10 * 60 * 1000);
                    const newRoleData = new roleModel({
                        userId: user.id,
                        roleId: role.id,
                        expirationDate: expirationDate,
                        guildId: message.guild.id
                    });
                    await newRoleData.save();

                    return message.delete();
                } else {
                    return message.reply('The user has no **OOC Meet** role');
                }
            } else {
                if (userMember.roles.cache.has(client.ooc.OOC)) {
                    await userMember.roles.remove(role);
                    await RoleLog('LIVE', 'REMOVE', userMember.id, message.author.id, logChan);
                    return message.delete();
                } else {
                    return message.reply('The user has no **OOC Meet** role');
                }
            }
        }
    }
}
