const { EmbedBuilder, Events } = require("discord.js");

const reactionModLog = require('../../database/modals/reactionModLog.js');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user, client) {

        if (!client.config.moderation.reactionmod.enabled) return;
        if (user.bot) return;

        const emojisToRemove = client.config.moderation.reactionmod.emojitoremove;
        const emoji = reaction.emoji.name;

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Reaction Mod' })
            .setTimestamp();

        if (reaction.message && emojisToRemove.includes(emoji)) {
            try {

                const reactionModData = await reactionModLog.findOne({
                    userId: user.id
                }).catch((err) => { return; });

                if (!reactionModData) {
                    const newReactionModData = new reactionModLog({
                        userId: user.id,
                        count: 1,
                        logs: [{
                            guildId: reaction.message.guildId,
                            channelId: reaction.message.channelId,
                            emoji: emoji,
                            timestamp: Date.now(),
                        }],
                    });
                    await newReactionModData.save().catch((err) => { return; });
                } else {
                    reactionModData.count += 1;
                    reactionModData.logs.push({
                        guildId: reaction.message.guildId,
                        channelId: reaction.message.channelId,
                        emoji: emoji,
                        timestamp: Date.now(),
                    });
                    await reactionModData.save().catch((err) => { return; });
                }

                await reaction.remove(user);
                embed.setDescription(`${emoji} **Reaction Removed!**`)
                    .setColor('Red')
                    .setFields(
                        { name: 'User', value: `<@${user.id}>` },
                        { name: 'Channel', value: `<#${reaction.message.channelId}>` },
                        { name: 'Message URL', value: `[Jump to Message](${reaction.message.url})` }
                    );
                await client.channels.cache.get(client.config.moderation.reactionmod.logchannel).send({ embeds: [embed] });
            } catch (error) {
                client.logger.error(`Error removing ${emoji} reaction:`, error);
            }
        }
    },
};
