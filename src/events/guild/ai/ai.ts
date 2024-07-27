import path from "path";
import { Events, Message, Client } from "discord.js";
import { MongoClient } from "mongodb";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";

import { BotEvent } from "../../../types";

config();

const mongoClient = new MongoClient(process.env.MONGO_URI || "", {
    driverInfo: { name: "langchainjs" },
});

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
    model: "llama3-70b-8192",
});

const splitMessage = (message: string, maxLength = 1900) => {
    const result = [];
    while (message.length > 0) {
        result.push(message.substring(0, maxLength));
        message = message.substring(maxLength);
    }
    return result;
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

        await mongoClient.connect();
        const collection = mongoClient.db("langchain").collection("memory");

        const directory = path.join(__dirname, "..", "..", "..", "..", "vector-store");
        const vectorStore = await FaissStore.load(
            directory,
            new HuggingFaceInferenceEmbeddings({ apiKey: process.env.HUGGINGFACEHUB_API_KEY })
        );

        const retriever = vectorStore.asRetriever();
        const retrievedDocs = await retriever.invoke(message.content);
        const context = retrievedDocs.map(doc => doc.pageContent).join("\n\n");

        const memory = new BufferMemory({
            chatHistory: new MongoDBChatMessageHistory({
                collection,
                sessionId: message.author.id,
            }),
            returnMessages: true,
            memoryKey: "iconic-history",
        });

        const userDetailText = `Username: ${message.author.username} | User ID: ${message.author.id} | User Tag: ${message.author.tag} | User Avatar: ${message.author.displayAvatarURL()}`;

        const SYSTEM_PROMPT: string = `
            You are Iconic Roleplay Discord Bot, a helpful support assistant for the Iconic Roleplay community.
            Your primary function is to answer user questions and queries related to FiveM and RedM servers within the Iconic Roleplay community.

            Guidelines for the chat:
                - Be polite, respectful, and friendly to all users.
                - Do not share any personal or sensitive information.
                - If a user asks about other servers, politely redirect them to focus on the Iconic Roleplay community.
                - If the user's question is not related to FiveM, RedM, or roleplay, kindly ask for more information or context.
                - If the user is not satisfied with an answer, suggest they contact the support team or raise a ticket.
                - Use Discord's built-in markdown to format text for better readability.
                - Do not tag any user or role in the chat. Strictly avoid using @everyone and @here.
                - Use emojis sparingly to make the chat more engaging, but don't overuse them. For example:
                    - Use 👋 when greeting users
                    - Use 🤔 when asking for more information
                    - Use ✅ when confirming or agreeing
                    - Use 🎮 when discussing game-related topics

            User's Discord details:
                The user's Discord details are provided in the following triple backticks. Use this information to personalize your responses, but do not directly mention or expose these details:
                \`\`\`${userDetailText}\`\`\`

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

            Remember, your goal is to be helpful, informative, and to enhance the user's experience with Iconic Roleplay. If you're unsure about any information, it's better to admit uncertainty and suggest official resources rather than provide potentially incorrect information.
            `;

        try {

            const prompt = ChatPromptTemplate.fromMessages([
                ['system', SYSTEM_PROMPT],
                new MessagesPlaceholder("iconic-history"),
                ['human', '{input}']
            ]);

            const chain = new ConversationChain({
                llm: model,
                memory: memory,
                prompt: prompt,
                outputParser: new StringOutputParser()
            });

            const response = await chain.invoke({
                input: `${message.content}`
            });

            const responseContent = String(response.response);
            if (!responseContent) return;

            const chunks = splitMessage(responseContent);
            for (const chunk of chunks) {
                await message.channel.send(chunk);
            }

            return await message.reply({ content: responseContent });
        } catch (error) {
            client.logger.error(error);
            await message.reply('Failed to process the query. Please try again later.');
        } finally {
            await mongoClient.close();
        }
    }
};

export default event;