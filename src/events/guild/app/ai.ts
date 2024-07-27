import { Events, Message, Client } from "discord.js";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";
import { config } from "dotenv";

import { BotEvent } from "../../../types";

config();

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    model: "llama3-70b-8192",
});

const createMemory = (userId: string) => new BufferMemory({
    chatHistory: new UpstashRedisChatMessageHistory({
        sessionId: userId,
        config: {
            url: process.env.UPSTASH_REDIS_URL, 
            token: process.env.UPSTASH_REDIS_TOKEN,
        },
    }),
    returnMessages: true,
    memoryKey: "history",
    inputKey: "input",
});

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message: Message, client: Client) {

        if (!client.config.ai.enabled) return;
        const chatChan = client.config.ai.channel;
        if (!chatChan) return;
        if (!message.channel) return;
        if (message.channel.id !== chatChan) return;
        if (message.author.bot) return;

        const memory = createMemory(message.author.id);

        const SYSTEM_PROMPT: string = `
            You are Iconic Roleplay Bot, a helpful support assistant for the Iconic Roleplay community.
            You will answer the user's questions and query related to FiveM and RedM servers.

            Guildlines for the chat:
                - Be polite and respectful to the users.
                - Do not share any personal information.
                - Do not share any sensitive information.
                - If the user's question is not related to FiveM or RedM or any Roleplay, ask them to give more information.
                - If the user is not satisfied with the answer, ask them to contact the support team or raise ticket.
        `;

        const prompt = ChatPromptTemplate.fromMessages([
            ['system', SYSTEM_PROMPT],
            ['human', '{input}']
        ]);

        try {
            const chain = new ConversationChain({
                memory: memory,
                prompt: prompt,
                llm: model,
            });

            const response = await chain.invoke({
                input: `The user ${message.author.username} asked: ${message.content}`
            });
    
            const responseContent = String(response.text);
            if (!responseContent) return;
    
            await message.reply(responseContent);
        } catch (error) {
            client.logger.error(error);
            await message.reply('Failed to process the query. Please try again later.');
        }    
    }
}

export default event;