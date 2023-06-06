const {
    EmbedBuilder
} = require('discord.js');

module.exports = {
    name: 'rmrole',
    description: "Removes Specific role from all users",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_RMROLE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var roleID = args.join(" ");
        await message.delete();

        //blacklist role

        function blacklistembed() {
            const ReplyEmbed = new EmbedBuilder()
                .setColor("#ED4245")
                .setDescription('Black Listed Role');

            return message.channel.send({
                embeds: [ReplyEmbed],
                content: `<@${message.author.id}>`,
            }).then((msg) => {
                setTimeout(function () {
                    msg.delete();
                }, 4000);
            });
        }

        if (roleID.includes('1017410239869505558')) {
            return blacklistembed();
        } else if (roleID.includes('784794493580476438')) {
            return blacklistembed();
        } else if (roleID.includes('1017410017957249044')) {
            return blacklistembed();
        }

        await message.guild.members.fetch();
        let roleInfo = await message.guild.roles.cache.find(x => x.id === roleID);

        if (roleInfo == undefined) {

            const ReplyEmbed = new EmbedBuilder()
                .setColor("#ED4245")
                .setDescription('Role does not exist!');

            return message.channel.send({
                embeds: [ReplyEmbed],
                content: `<@${message.author.id}>`,
            }).then((msg) => {
                setTimeout(function () {
                    msg.delete();
                }, 4000);
            });
        }

        //var List;
        await message.guild.members.cache.forEach(async (member) => {
            await member.roles.remove(roleID);
            //List += `<@${member.id}>`;
        });
        
        /*const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setDescription(`**Common Roles:** ${List.substring(9)}`);

        return message.channel.send({ embeds: [embed] });*/
    }
};