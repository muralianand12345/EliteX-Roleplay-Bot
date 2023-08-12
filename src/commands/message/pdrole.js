module.exports = {
    name: 'pdrole',
    description: "PD Role Management",
    cooldown: 10,
    userPerms: [],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_PDROLE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var user = message.mentions.users.first();
        if (!user) return;
        const userMember = message.guild.members.cache.get(user.id);

        if (!args[1]) return
        var option = args[1].toLowerCase();

        switch (option) {

            case 'fto':
                if (message.member.roles.cache.has(client.jobs.PD.HO)) {
                    if (userMember.roles.cache.has(client.jobs.PD.ROLEID)) {
                        const role = message.guild.roles.cache.get(client.jobs.PD.FTO);
                        if (!role) return;
                        if (userMember.roles.cache.has(client.jobs.PD.FTO)) {
                            userMember.roles.remove(role);
                            await message.delete();
                        } else {
                            userMember.roles.add(role);
                            await message.delete();
                        }
                    }
                }
                break;

            case 'intern':
                if (message.member.roles.cache.has(client.jobs.PD.HO)) {
                    if (userMember.roles.cache.has(client.jobs.PD.ROLEID)) {
                        const role = message.guild.roles.cache.get(client.jobs.PD.INTERN);
                        if (!role) return;
                        if (userMember.roles.cache.has(client.jobs.PD.INTERN)) {
                            userMember.roles.remove(role);
                            await message.delete();
                        } else {
                            userMember.roles.add(role);
                            await message.delete();
                        }
                    }
                }
                break;

            default:
                if (message.member.roles.cache.has(client.jobs.PD.HO)) {
                    message.reply('Available Options: `fto || intern`');
                }
                break;
        }
    }
}