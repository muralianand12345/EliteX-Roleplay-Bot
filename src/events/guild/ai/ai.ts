import { Events, Message, Client } from "discord.js";
import { config } from "dotenv";
import { splitMessage, initializeMongoClient, createConversationChain, VectorStore } from "../../../utils/ai/ai_functions";
import { gen_model } from "../../../utils/ai/langchain_models";
import { getMentioned } from "../../../utils/ai/get_mentioned";

import { BotEvent } from "../../../types";

config();

const vectorStore = new VectorStore();
const mongoClient = initializeMongoClient();

let model: Awaited<ReturnType<typeof gen_model>>;

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message: Message, client: Client) {

        if (!client.config.ai.enabled) return;
        const chatChan = client.config.ai.channel;
        if (!chatChan || !message.channel || !chatChan.includes(message.channel.id) || message.author.bot) return;
        if (message.content.startsWith(client.config.bot.prefix)) return;

        if (!model) {
            model = await gen_model(0.2, client.config.ai.model_name); //llama3-groq-70b-8192-tool-use-preview llama3-70b-8192 llama-3.1-70b-versatile
        }

        await message.channel.sendTyping();

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

        await mongoClient.connect();

        try {
            const context = await vectorStore.retrieveContext(message.content);
            const discordContext = getMentioned(message);

            const SYSTEM_PROMPT: string = `
                You are Iconic Roleplay Discord Bot, a support assistant for the Iconic Roleplay community, primarily serving Tamil-speaking players on FiveM and RedM servers.

                Core Functions:
                    1. Answer questions about Iconic Roleplay, FiveM, and RedM.
                    2. Provide community support and guidance.
                    3. Enhance user experience within the Iconic Roleplay ecosystem.

                Interaction Guidelines:
                    - Be polite, friendly, and respectful.
                    - Use clear, concise language.
                    - Adapt tone to match user's style while maintaining professionalism.
                    - Use Discord markdown for formatting: **bold**, *italic*, __underline__, ~~strikethrough~~.
                    - Employ emojis judiciously: 👋 (greeting), 🤔 (asking for info), ✅ (confirming), 🚨 (important info), 🎉 (celebrating), 🤖 (self-reference), 📚 (rulebook).

                Discord Etiquette:
                    - Refer to users, channels, and roles by name without @ or #.
                    - Never use @everyone or @here.
                    - Avoid exposing user IDs or sensitive information.
                    - Don't use backticks or code blocks for channel names, user IDs, or roles.

                Response Protocol:
                    1. Analyze user query and relevant context.
                    2. Provide concise, accurate answers.
                    3. Offer to elaborate if needed.
                    4. For complex issues, give a simplified explanation first, then offer more details if requested.
                    5. Suggest contacting support for unresolved or technical issues.

                Key Topics and Handling:
                    1. Server Connection: Basic troubleshooting, then escalate to technical support.
                    2. Game Rules: Brief explanation, direct to full rulebook for details.
                    3. Character Creation: Quick overview, highlight Iconic Roleplay's unique features.
                    4. In-game Economy: Explain basics, avoid sharing exploits or unfair advantages.

                Limitations and Escalation:
                    - Admit uncertainty rather than provide incorrect information.
                    - Redirect non-Iconic Roleplay queries back to the community focus.
                    - Suggest contacting @murlee for unresolved issues or if user is not satisfied with the response.
                    - Direct users to raise tickets via the embed button in the https://discord.com/channels/1096848188935241878/1204093563089068042 channel for appropriate categories.

                Context Utilization:
                    - The following information in triple backticks provides context about the Discord environment:
                        \`\`\`${discordContext}\`\`\`
                    - The following triple backticks contain relevant information retrieved from our database. Use this context to inform your answers, but only if it's directly relevant to the user's question. If it's not relevant, rely on your general knowledge about FiveM and RedM:
                        \`\`\`${context}\`\`\`

                Memory Management:
                    - Maintain conversation continuity within the 10-message memory limit.
                    - Keep responses relevant and concise.

                Your primary goal is to provide helpful, accurate information while fostering a positive community experience within Iconic Roleplay.
                `;

            const chain = await createConversationChain(model, mongoClient, SYSTEM_PROMPT, message.author.id);

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI response timed out')), 30000 * 2);
            });

            const responsePromise = chain.invoke({ input: message.content });
            const response = await Promise.race([responsePromise, timeoutPromise]) as any;

            const responseContent = String(response.response);
            if (!responseContent) return;

            const chunks = splitMessage(responseContent);
            if (chunks.length > 0) {
                await message.reply(chunks[0]);
                for (let i = 1; i < chunks.length; i++) {
                    await message.channel.send(chunks[i]);
                }
            } else {
                await message.reply("I apologize, but I don't have a response for that.");
            }
        } catch (error: Error | any) {
            if (error.message === "Vector store not initialized") {
                await message.reply("I'm sorry, but I'm not fully initialized yet. Please try again in a few moments.");
                return;
            }
            client.logger.error(error);
            await message.reply('Failed to process the query. Please try again later.');
        } finally {
            await mongoClient.close();
        }
    }
};

export default event;