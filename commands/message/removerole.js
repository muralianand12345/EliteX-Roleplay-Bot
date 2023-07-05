const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rmrole',
    description: "Removes specific role from all users",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {
        const commandName = `MESS_RMROLE`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var roleID = args.join(" ");
        await message.delete();

        // Blacklist role
        function blacklistembed() {
            const ReplyEmbed = new EmbedBuilder()
                .setColor("#ED4245")
                .setDescription('Blacklisted Role');

            return message.channel.send({
                embeds: [ReplyEmbed],
                content: `<@${message.author.id}>`,
            }).then((msg) => {
                setTimeout(function () {
                    msg.delete();
                }, 4000);
            });
        }

        const roleIDs = [
            '1096863473792716961',
            '1096856106749394994',
            '1099268792086970378'
        ];

        if (roleIDs.includes(roleID)) {
            return blacklistembed();
        }

        const roleInfo = message.guild.roles.cache.get(roleID);

        if (!roleInfo) {
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

        const members = message.guild.members.cache;
        const batchSize = 10;
        let delay = 1000;

        const memberArray = Array.from(members.values());
        for (let i = 0; i < memberArray.length; i += batchSize) {
            const batch = memberArray.slice(i, i + batchSize);
            await Promise.all(batch.map(async (member) => {
                await member.roles.remove(roleID).catch(console.error);
            }));
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};