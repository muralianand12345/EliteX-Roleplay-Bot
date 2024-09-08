import { Events, Webhook, WebhookClient, TextChannel, EmbedBuilder } from "discord.js";
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.channel.id !== client.config.gang.channel.darkchat) return;
        if (message.author.bot) return;

        const content = message.content.trim();
        if (!content || content.length > 1024) {
            await message.delete();
            return;
        }

        try {
            const webhooks = await message.channel.fetchWebhooks();
            let webhook = webhooks.find((w: Webhook) => w.name === "DarkChat");

            if (!webhook) {
                webhook = await message.channel.createWebhook({
                    name: "DarkChat",
                    avatar: client.user?.displayAvatarURL(),
                });
            }

            await webhook.send({
                content: content,
                username: "DarkChat",
                avatarURL: client.user?.displayAvatarURL(),
            });

            const logChannelId = client.config.gang.channel.darkchatLog;
            const logChannel = client.channels.cache.get(logChannelId) as TextChannel;

            const embed = new EmbedBuilder()
                .setColor('Grey')
                .setTitle('DarkChat Message')
                .addFields(
                    { name: 'User', value: message.author.username, inline: true },
                    { name: 'Content', value: `\`\`\`${content}\`\`\``, inline: true }
                )
                .setFooter({ text: message.author.id })
                .setTimestamp();


            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            } else {
                client.logger.warn("DarkChat log channel not found");
            }

            await message.delete();
        } catch (error) {
            client.logger.error("Error in DarkChat event:", error);
        }
    }
};

export default event;