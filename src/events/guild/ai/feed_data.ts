import { Events, Message, Client, TextChannel, VoiceChannel, ThreadChannel, NewsChannel, User } from "discord.js";
import { config } from "dotenv";
import { processNewData } from "../../../utils/ai/ai_functions";

import { BotEvent } from "../../../types";

config();

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message: Message, client: Client) {
        
        if (!client.config.ai.enabled) return;
        const channel_data_list = client.config.ai.channel_data_list;
        if (!channel_data_list || !channel_data_list.includes(message.channel.id) || message.author.bot) return;

        const msg_channel = message.channel as  TextChannel | VoiceChannel | ThreadChannel | NewsChannel;
        const msg_user = message.author as User;

        const channel_data = `
**Message From Channel**: [Name] -> (${msg_channel.name}) [Id] -> (${msg_channel.id}) [Type] -> (${msg_channel.type})
**Message From User**: [Tag] -> (${msg_user.tag}) [Username] -> (${msg_user.username}) [Id] -> (${msg_user.id})
**Message Content**:
    ${message.content}
**Timestamp**: ${new Date().toLocaleString()}
        `.trim();

        try {
            await processNewData(channel_data, {
                channelId: msg_channel.id,
                channelName: msg_channel.name,
                userId: msg_user.id,
                username: msg_user.username,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            client.logger.error(`Error processing message for AI: ${error}`);
        }
    },
};

export default event;