module.exports = {
    name: 'fto',
    description: "PD FTO Role",
    cooldown: 20000,
    userPerms: [],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_FTO`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var user = message.mentions.users.first();
        if (!user) return;
        const userMember = message.guild.members.cache.get(user.id);
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
    }
}