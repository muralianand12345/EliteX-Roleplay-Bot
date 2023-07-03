const { EmbedBuilder, Events } = require("discord.js");

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user, client) {
        const emojisToRemove = client.mod.REACTION.REACT;
        const emoji = reaction.emoji.name;

        const embed = new EmbedBuilder()
        .setAuthor({ name: 'Reaction Mod' })
        .setTimestamp();

        if (user.bot) return;
        
        if (reaction.message && emojisToRemove.includes(emoji)) {
            try {
                await reaction.remove(user);
                embed.setDescription(`${emoji} **Reaction Removed!**`)
                .setColor('Red')
                .setFields(
                    { name: 'User', value: `<@${user.id}>`},
                    { name: 'Channel', value: `<#${reaction.message.channelId}>` },
                    { name: 'Message URL', value: `[Jump to Message](${reaction.message.url})` }
                );
                await client.channels.cache.get(client.mod.REACTION.LOG).send({ embeds:[ embed] });
            } catch (error) {
                console.error(`Error removing ${emoji} reaction:`, error);
            }
        }
    },
};
