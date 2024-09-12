import { Events, Webhook, Message, Client, TextChannel, EmbedBuilder, User, Role } from "discord.js";
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (!client.config.gang.enabled) return;
        if (message.author.bot) return;

        const isDarkchat = message.channel.id === client.config.gang.hightable.anonchat.channel.darkchat;
        const isHightable = message.channel.id === client.config.gang.hightable.anonchat.channel.hightable;

        if (!isDarkchat && !isHightable) return;

        const chatLogger = async (user: User, content: string, type: 'darkchat' | 'hightable') => {
            const channel = client.channels.cache.get(client.config.gang.hightable.anonchat.channel.log) as TextChannel;
            if (!channel) return client.logger.warn("AnonChat log channel not found");

            const embed = new EmbedBuilder()
                .setColor('Grey')
                .setTitle('Message Log')
                .addFields(
                    { name: 'User', value: user.username },
                    { name: 'Type', value: `\`${type}\`` },
                    { name: 'Content', value: `\`\`\`${content}\`\`\`` }
                )
                .setFooter({ text: user.id })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        };

        const sendWebhookMessage = async (client: Client, message: Message, webhookName: string, username: string) => {
            const content = message.content.trim();
            if (!content || content.length > 1024) {
                await message.delete();
                return;
            }

            const chan = message.channel as TextChannel;

            const webhooks = await chan.fetchWebhooks();
            let webhook = webhooks.find((w: Webhook) => w.name === webhookName);
            if (!webhook) {
                webhook = await chan.createWebhook({
                    name: webhookName,
                    avatar: client.user?.displayAvatarURL(),
                });
            }

            await webhook.send({
                content: content,
                username: username,
                avatarURL: client.user?.displayAvatarURL(),
            });

            await chatLogger(message.author, content, isDarkchat ? 'darkchat' : 'hightable');
            await message.delete();
        };

        try {
            if (isDarkchat) {
                await sendWebhookMessage(
                    client,
                    message,
                    client.config.gang.hightable.anonchat.webhook.darkchat,
                    client.config.gang.hightable.anonchat.webhook.darkchat
                );
            } else if (isHightable) {
                const lordRoles = client.config.gang.hightable.lords.role;
                const memberRoles = message.member?.roles.cache;
                
                let lordRole: Role | undefined;
                if (memberRoles) {
                    lordRole = memberRoles.find((role: Role) => lordRoles.includes(role.id));
                }

                if (lordRole) {
                    await sendWebhookMessage(
                        client,
                        message,
                        client.config.gang.hightable.anonchat.webhook.hightable,
                        lordRole.name
                    );
                } else {
                    await sendWebhookMessage(
                        client,
                        message,
                        client.config.gang.hightable.anonchat.webhook.hightable,
                        client.config.gang.hightable.anonchat.webhook.hightable
                    );
                }
            }
        } catch (error) {
            client.logger.error("Error in AnonChat event:", error);
        }
    }
};

export default event;