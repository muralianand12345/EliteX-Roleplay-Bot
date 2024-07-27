import fs from "fs/promises";
import path from "path";
import { Events, Message, Client } from "discord.js";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { config } from "dotenv";

import { BotEvent } from "../../../types";

config();

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    model: "llama3-70b-8192",
});

const MEMORY_DIR = path.join(__dirname, '..', '..', '..', 'memory');
fs.mkdir(MEMORY_DIR, { recursive: true }).catch(console.error);

const loadMemory = async (userId: string): Promise<BufferMemory> => {
    const filePath = path.join(MEMORY_DIR, `${userId}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const savedMemory = JSON.parse(data);
        return new BufferMemory(savedMemory);
    } catch (error) {
        return new BufferMemory();
    }
};

const saveMemory = async (userId: string, memory: BufferMemory) => {
    const filePath = path.join(MEMORY_DIR, `${userId}.json`);
    const data = JSON.stringify(memory);
    await fs.writeFile(filePath, data, 'utf8');
};

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message: Message, client: Client) {

        if (!client.config.ai.enabled) return;
        const chatChan = client.config.ai.channel;
        if (!chatChan) return;
        if (!message.channel) return;
        if (message.channel.id !== chatChan) return;
        if (message.author.bot) return;

        const memory = await loadMemory(message.author.id);

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

            const response = await chain.call({
                input: `The user ${message.author.username} asked: ${message.content}`
            });
    
            const responseContent = String(response.response);
            if (!responseContent) return;
    
            await message.reply(responseContent);
            await saveMemory(message.author.id, memory);
        } catch (error) {
            client.logger.error(error);
            await message.reply('Failed to process the query. Please try again later.');
        }    
    }
}

export default event;