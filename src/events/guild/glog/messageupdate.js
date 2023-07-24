const {
    EmbedBuilder,
    Events
} = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client) {

        if (!oldMessage.guild) return;
        if (oldMessage.guild.id !== client.glog.GUILDID) return;
        if (!oldMessage.author) return;
        if (oldMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const Count = 1950;
        const Original = oldMessage.content.slice(0, Count) + (oldMessage.content.length > 1950 ? " ..." : "");
        const Edited = newMessage.content.slice(0, Count) + (newMessage.content.length > 1950 ? " ..." : "");

        const logEmbed = new EmbedBuilder()
            .setDescription(`A [**Message**](${newMessage.url}) by ${newMessage.author} was **Edited** in ${newMessage.channel}.\n
            **Original**:\n ${Original} \n**Edited**:\n ${Edited}`.slice("0", "4096"))
            .addFields(
                { name: "Guild Name", value: `${oldMessage.guild.name}` }
            )
            .setFooter({ text: `Member: ${newMessage.author.tag} | ID: ${newMessage.author.id.toString()}` })
            .setTimestamp();

        await client.glogger.glog("Iconic Message Log", logEmbed);
        return await client.channels.cache.get(client.glog.MESSAGE.UPDATE).send({
            embeds: [logEmbed]
        });
    }
};