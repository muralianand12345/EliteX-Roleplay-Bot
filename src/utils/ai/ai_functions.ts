import path from "path";
import fs from 'fs/promises';
import { Client } from "discord.js";
import { config } from 'dotenv';
import { MongoClient } from "mongodb";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { UnstructuredLoader } from "@langchain/community/document_loaders/fs/unstructured";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatGroq } from "@langchain/groq";
import { LimitedBufferMemoryOptions } from "../../types";

config();

class LimitedBufferMemory extends BufferMemory {
    private maxHistory: number;

    constructor(options: LimitedBufferMemoryOptions) {
        super(options);
        this.maxHistory = options.maxHistory;
    }

    async saveContext(inputValues: Record<string, any>, outputValues: Record<string, any>): Promise<void> {
        await super.saveContext(inputValues, outputValues);
        await this.pruneMessages();
    }

    private async pruneMessages(): Promise<void> {
        const messages = await this.chatHistory.getMessages();
        if (messages.length > this.maxHistory) {
            await this.chatHistory.clear();
            for (let i = messages.length - this.maxHistory; i < messages.length; i++) {
                await this.chatHistory.addMessage(messages[i]);
            }
        }
    }
};

const splitMessage = (message: string, maxLength = 1900): string[] => {
    const result: string[] = [];
    let currentChunk = '';
    let currentLine = '';

    const lines = message.split('\n');

    for (const line of lines) {
        if ((currentChunk + currentLine + line).length <= maxLength) {
            currentLine += (currentLine ? '\n' : '') + line;
        } else {
            if (currentChunk) {
                result.push(currentChunk.trim());
                currentChunk = '';
            }
            if (currentLine) {
                currentChunk = currentLine + '\n';
                currentLine = '';
            }
            if (line.length > maxLength) {
                let remainingLine = line;
                while (remainingLine.length > 0) {
                    const chunk = remainingLine.slice(0, maxLength);
                    result.push(chunk.trim());
                    remainingLine = remainingLine.slice(maxLength);
                }
            } else {
                currentLine = line;
            }
        }
    }

    if (currentChunk || currentLine) {
        result.push((currentChunk + currentLine).trim());
    }

    return result;
};

const initializeMongoClient = async () => {
    return await new MongoClient(process.env.LLM_MONGO_URI || "", {
        driverInfo: { name: "langchainjs" },
    }).connect();
};

const createConversationChain = async (client: Client, model: ChatGroq, mongoClient: MongoClient, systemPrompt: string, userId: string, memory_enabled: boolean = true, maxHistory: number = 10) => {
    const collection = mongoClient.db(client.config.ai.database.db_name).collection(client.config.ai.database.collection_name);

    let memory = undefined;
    let prompt: ChatPromptTemplate;
    if (memory_enabled) {
        memory = new LimitedBufferMemory({
            chatHistory: new MongoDBChatMessageHistory({
                collection,
                sessionId: userId,
            }),
            returnMessages: true,
            memoryKey: client.config.ai.database.memory_key,
            maxHistory: maxHistory
        });

        prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt],
            new MessagesPlaceholder(client.config.ai.database.memory_key),
            ['human', '{input}']
        ]);
    } else {
        prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt],
            ['human', '{input}']
        ]);
    }

    return new ConversationChain({
        llm: model,
        memory: memory,
        prompt: prompt,
        outputParser: new StringOutputParser()
    });
};

class VectorStore {
    private vectorStore: FaissStore | null = null;
    private embeddings: HuggingFaceInferenceEmbeddings;
    private directory: string;

    constructor(client: Client) {
        this.embeddings = new HuggingFaceInferenceEmbeddings({
            model: client.config.ai.model_name.embed,
            apiKey: process.env.HUGGINGFACEHUB_API_KEY
        });
        this.directory = path.join(__dirname, "..", "..", "..", "vector-store");
    }

    async initialize() {
        try {
            await fs.mkdir(this.directory, { recursive: true });
            const files = await fs.readdir(this.directory);
            if (files.includes('faiss.index') && files.includes('docstore.json')) {
                this.vectorStore = await FaissStore.load(this.directory, this.embeddings);
            }
        } catch (error: any) {
            console.error("Error during initialization:", error.message);
        }
    }

    async checkDataExists(content: string): Promise<boolean> {
        if (!this.vectorStore) {
            return false;
        }
        const results = await this.vectorStore.similaritySearch(content, 1);
        return results.length > 0 && results[0].pageContent === content;
    }

    async addOrUpdateData(content: string, metadata: Record<string, any> = {}, override: boolean = false) {
        if (!this.vectorStore) {
            this.vectorStore = await FaissStore.fromTexts([content], [metadata], this.embeddings);
            await this.vectorStore.save(this.directory);
            return;
        }

        const exists = await this.checkDataExists(content);

        if (exists && !override) {
            return;
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await textSplitter.createDocuments([content], [metadata]);

        if (exists && override) {
            try {
                const existingDocs = await this.vectorStore.similaritySearch(content, 1);
                if (existingDocs.length > 0) {
                    const existingDoc = existingDocs[0];
                    if (existingDoc.metadata && existingDoc.metadata.id) {
                        await this.vectorStore.delete({ ids: [existingDoc.metadata.id] });
                    }
                }
            } catch (error) {
                console.error("Error deleting existing document. Proceeding with addition.", error);
            }
        }

        await this.vectorStore.addDocuments(docs);
        await this.vectorStore.save(this.directory);
    }

    async reloadData(markdownPath: string, override: boolean = false) {
        try {
            const loader = new UnstructuredLoader(markdownPath, {
                apiKey: process.env.UNSTRUCTURED_API_KEY,
                apiUrl: process.env.UNSTRUCTURED_API_URL,
                chunkingStrategy: "by_title"
            });

            const docs = await loader.load();
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const splits = await textSplitter.splitDocuments(docs);

            if (splits.length === 0) {
                return;
            }

            if (!this.vectorStore) {
                this.vectorStore = await FaissStore.fromDocuments([splits[0]], this.embeddings);
                splits.shift();
            }

            for (const doc of splits) {
                await this.addOrUpdateData(doc.pageContent, doc.metadata, override);
            }

            await this.vectorStore.save(this.directory);
        } catch (error: any) {
            console.error("Error reloading data:", error.message);
            throw error;
        }
    }

    async retrieveContext(query: string, k: number = 5): Promise<string> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized");
        }
        const retriever = this.vectorStore.asRetriever({ k });
        const retrievedDocs = await retriever.invoke(query);
        return retrievedDocs.map(doc => doc.pageContent).join("\n\n");
    }
};

async function processNewData(client: Client, content: string, metadata: Record<string, any> = {}, override: boolean = false) {
    const vectorStore = new VectorStore(client);
    await vectorStore.initialize();
    await vectorStore.addOrUpdateData(content, metadata, override);
};

export { splitMessage, initializeMongoClient, createConversationChain, VectorStore, processNewData };