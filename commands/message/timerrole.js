const roleModel = require('../../events/models/roleremove.js');

module.exports = {
    name: 'timerole',
    description: "Timed role remover",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_TIMEROLE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var user = message.mentions.users.first();
        var role = message.mentions.roles.first();

        if (!role) return;
        if (!user) return;

        const roleData = await roleModel.findOne({
            userId: user.id,
            roleId: role.id
        }).catch(err => console.log(err));

        if (roleData) {
            return message.reply('User already has role removal in process.');
        } else {
            const expirationDate = new Date(Date.now() + 1 * 60 * 1000);
            const newRoleData = new roleModel({
                userId: user.id,
                roleId: role.id,
                expirationDate: expirationDate,
                guildId: message.guild.id
            });
            await newRoleData.save();

            return message.reply('User added!');
        }
    }
};