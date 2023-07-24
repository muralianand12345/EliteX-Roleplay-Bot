const {
    EmbedBuilder
} = require('discord.js');

module.exports = {
    name: 'rolecheck',
    description: "Sends user whith common role",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: [],
    run: async (client, message, args) => {

        const commandName = `MESS_ROLECHECK`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var Role1ID = args[0];
        var Role2ID = args[1];

        var Role1 = await message.guild.roles.cache.find(role => role.id == Role1ID);
        var Role2 = await message.guild.roles.cache.find(role => role.id == Role2ID);

        var Role1_Total = await Role1.members.map(m => m.user);
        var Role2_Total = await Role2.members.map(m => m.user);

        var Role_Total = Role1_Total.filter((element) => {
            return Role2_Total.includes(element);
        });

        var List;
        for (var i = 0; i < Role_Total.length; i++) {
            List += `<@${Role_Total[i].id}>`;
        }

        if(!List) return message.reply({ content: 'No Common Role!' });

        const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setDescription(`**Common Roles:** ${List.substring(9)}`);

        message.channel.send({ embeds: [embed] });
    }
};