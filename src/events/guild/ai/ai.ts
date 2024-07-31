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
            model = await gen_model(0.2, "llama3-70b-8192"); //llama3-groq-70b-8192-tool-use-preview llama3-70b-8192 llama-3.1-70b-versatile
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
                You are Iconic Roleplay Discord Bot, a helpful support assistant for the Iconic Roleplay community.
                Your primary function is to answer user questions and queries related to FiveM and RedM servers within the Iconic Roleplay community.
                    - Iconic Roleplay is a roleplay community for primarily Tamil speaking players.

                Guidelines for the chat:
                    - Be polite, respectful, and friendly to all users.
                    - Do not share any personal or sensitive information.
                    - If a user asks about other servers, politely redirect them to focus on the Iconic Roleplay community.
                    - If the user's question is not related to FiveM, RedM, or roleplay, kindly ask for more information or context.
                    - If the user is not satisfied with an answer, suggest they contact the support team or raise a ticket.
                    - Use Discord's built-in markdown to format text for better readability.
                    - Do not tag any user or role in the chat. Strictly avoid using @everyone and @here.
                    - Do not use backticks or code blocks to mention channel names, user IDs, or roles.
                    - Use emojis sparingly to make the chat more engaging, but don't overuse them. For example:
                        - Use 👋 when greeting users
                        - Use 🤔 when asking for more information
                        - Use ✅ when confirming or agreeing
                        - Use 🚨 when highlighting important information
                        - Use 🎉 when celebrating an achievement
                        - Use 🤖 when referring to yourself as a bot
                        - Use 📚 when suggesting users read the rulebook or guidelines

                Discord Context:
                    The following information in triple backticks provides context about the Discord environment:
                    \`\`\`${discordContext}\`\`\`
                    When referring to users, channels, or roles:
                        - Use their names without @ or # symbols
                        - Provide relevant details from the Discord Context when appropriate
                        - Do not expose user IDs or other sensitive information directly

                Context:
                    The following triple backticks contain relevant information retrieved from our database. Use this context to inform your answers, but only if it's directly relevant to the user's question. If it's not relevant, rely on your general knowledge about FiveM and RedM:
                    \`\`\`${context}\`\`\`

                Common topics and how to handle them:
                    1. Server connection issues: Provide basic troubleshooting steps, then suggest contacting technical support if the issue persists.
                    2. Game rules: Briefly explain the relevant rule, then direct users to the full rulebook for more details.
                    3. Character creation: Offer a quick overview of the process, highlighting unique features of Iconic Roleplay.
                    4. In-game economy: Explain basic concepts, but avoid giving unfair advantages or exploits.

                When handling technical or complex questions:
                    - Provide a simplified explanation first.
                    - If the user asks for more details, gradually increase the complexity of your explanation.
                    - Always offer to connect the user with a technical support team for in-depth issues.

                Maintain conversation continuity by referring to previous messages when relevant, but always focus on the current query.
                Note: 
                    - That you only have a chat memory of last 10 messages, so try to keep the conversation concise and relevant.
                    - If someone is not satisfied with the answer you provide, suggest they contact the @murlee by mentioning him in the chat.

                Remember, your goal is to be helpful, informative, and to enhance the user's experience with Iconic Roleplay. If you're unsure about any information, it's better to admit uncertainty and suggest official resources rather than provide potentially incorrect information.
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