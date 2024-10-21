import { Events, Message, Client, TextChannel } from "discord.js";
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { splitMessage, initializeMongoClient, createConversationChain, VectorStore } from "../../../utils/ai/ai_functions";
import { gen_model } from "../../../utils/ai/langchain_models";
import { getMentioned } from "../../../utils/ai/get_mentioned";
import { client } from "../../../bot";
import { BotEvent } from "../../../types";
import blockUserAI from "../../database/schema/blockUserAI";

config();

const vectorStore = new VectorStore(client);
let mongoClient: MongoClient | null = null;
let model: Awaited<ReturnType<typeof gen_model>> | null = null;

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message: Message, client: Client) {

        if (!client.config.ai.enabled) return;
        const chan = message.channel as TextChannel;
        const chatChan = client.config.ai.channel;
        if (!chatChan || !chan || !chatChan.includes(chan.id) || message.author.bot) return;
        if (message.content.startsWith(client.config.bot.prefix)) return;

        await chan.sendTyping();

        const blockedUserData = await blockUserAI.findOne({
            userId: message.author.id,
            status: true
        });

        if (blockedUserData) {
            return message.reply('You are blocked from using the AI! Contact the server staff for more information.');
        }

        if (!model) model = await gen_model(0.2, client.config.ai.model_name.gen); //llama3-groq-70b-8192-tool-use-preview llama3-70b-8192 llama-3.1-70b-versatile
        if (!mongoClient) mongoClient = await initializeMongoClient();

        const chatbot_prompt = require("../../../utils/ai/ai_prompt").chatbot_prompt;

        try {
            await vectorStore.initialize();
        } catch (error) {
            client.logger.warn("Vector store not initialized. Attempting to initialize...");
            try {
                await vectorStore.initialize();
            } catch (initError) {
                client.logger.error("Failed to initialize vector store:", initError);
                await message.reply("I'm sorry, but I'm not fully initialized yet. Please try again in a few moments.");
                return;
            }
        }

        try {
            const context = await vectorStore.retrieveContext(message.content);
            const discordContext = getMentioned(message);

            const SYSTEM_PROMPT: string = chatbot_prompt(discordContext, context);
            const chain = await createConversationChain(client, model, mongoClient, SYSTEM_PROMPT, message.author.id);

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI response timed out')), 30000 * 2);
            });

            const responsePromise = chain.invoke({ input: message.content });
            const response = await Promise.race([responsePromise, timeoutPromise]) as any;

            const responseContent = String(response.response);
            if (!responseContent) return;

            const chunks = splitMessage(responseContent);
            if (chunks.length > 0) {
                try {
                    await message.reply(chunks[0]);
                    for (let i = 1; i < chunks.length; i++) {
                        if (chunks[i - 1].split('```').length % 2 === 0) {
                            chunks[i] = '```\n' + chunks[i];
                        }
                        if (chunks[i].split('```').length % 2 === 0) {
                            chunks[i] += '\n```';
                        }
                        await chan.send(chunks[i]);
                    }
                } catch (replyError: any) {
                    if (replyError.code === 10008) {
                        await chan.send("It seems the original message was deleted. Here's my response anyway:\n\n" + chunks.join('\n'));
                    } else {
                        throw replyError;
                    }
                }
            } else {
                try {
                    await message.reply("I apologize, but I don't have a response for that.");
                } catch (replyError: any) {
                    if (replyError.code === 10008) {
                        client.logger.warn("Original AI message was deleted. Unable to reply.");
                    } else {
                        throw replyError;
                    }
                }
            }
        } catch (error: Error | any) {
            try {
                await message.delete();
            } catch (deleteError) {
                client.logger.warn("Failed to delete original message:", deleteError);
            }
            if (error.message === "Vector store not initialized") {
                await chan.send("I'm sorry, but I'm not fully initialized yet. Please try again in a few moments.").then((msg) => {
                    setTimeout(() => msg.delete(), 5000);
                });
                return;
            } else if (error.message === "AI response timed out") {
                await chan.send("I'm sorry, but the response took too long. Please try again.").then((msg) => {
                    setTimeout(() => msg.delete(), 5000);
                });
                return;
            } else if (error.code === 50035) {
                await chan.send("I'm sorry, some internal error occured!").then((msg) => {
                    setTimeout(() => msg.delete(), 5000);
                });
                client.logger.warn(error);
                return;
            }
            client.logger.error(error);
            await chan.send('Failed to process the query. Please try again later.').then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });
        }
    }
};

export default event;