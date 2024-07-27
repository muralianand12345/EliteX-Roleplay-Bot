import { Events, Message, Client } from "discord.js";
import { MongoClient } from "mongodb";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { config } from "dotenv";

import { BotEvent } from "../../../types";

config();

const mongoClient = new MongoClient(process.env.MONGO_URI || "", {
    driverInfo: { name: "langchainjs" },
});

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    model: "llama3-70b-8192",
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

        await mongoClient.connect();
        const collection = mongoClient.db("langchain").collection("memory");

        const memory = new BufferMemory({
            chatHistory: new MongoDBChatMessageHistory({
                collection,
                sessionId: message.author.id,
            }),
        });

        const SYSTEM_PROMPT: string = `
            You are Iconic Roleplay Bot, a helpful support assistant for the Iconic Roleplay community.
            You will answer the user's questions and queries related to FiveM and RedM servers.

            Guidelines for the chat:
                - Be polite and respectful to the users.
                - Do not share any personal information.
                - Do not share any sensitive information.
                - If the user's question is not related to FiveM or RedM or any Roleplay, ask them to give more information.
                - If the user is not satisfied with the answer, ask them to contact the support team or raise a ticket.
        `;

        try {

            const prompt = ChatPromptTemplate.fromMessages([
                ['system', SYSTEM_PROMPT],
                new MessagesPlaceholder(message.author.id),
                ['human', '{input}']
            ]);    

            const chain = new ConversationChain({ 
                llm: model, 
                memory: memory,
                prompt: prompt
            });

            const response = await chain.invoke({
                input: `${message.content}`
            });

            const responseContent = String(response.response);
            if (!responseContent) return;

            await message.reply(responseContent);
        } catch (error) {
            client.logger.error(error);
            await message.reply('Failed to process the query. Please try again later.');
        } finally {
            await mongoClient.close();
        }
    }
}

export default event;