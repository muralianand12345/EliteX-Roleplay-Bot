import path from "path";
import fs from 'fs/promises';
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
}

const splitMessage = (message: string, maxLength = 1900): string[] => {
    const result = [];
    while (message.length > 0) {
        result.push(message.substring(0, maxLength));
        message = message.substring(maxLength);
    }
    return result;
}

const initializeMongoClient = () => {
    return new MongoClient(process.env.MONGO_URI || "", {
        driverInfo: { name: "langchainjs" },
    });
}

const createConversationChain = async(model: ChatGroq, mongoClient: MongoClient, systemPrompt: string, userId: string, memory_enabled: boolean = true, maxHistory: number = 10) => {
    const collection = mongoClient.db("langchain").collection("memory");

    let memory = undefined;
    let prompt: ChatPromptTemplate;
    if (memory_enabled) {
        memory = new LimitedBufferMemory({
            chatHistory: new MongoDBChatMessageHistory({
                collection,
                sessionId: userId,
            }),
            returnMessages: true,
            memoryKey: "iconic-history",
            maxHistory: maxHistory 
        });

        prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt],
            new MessagesPlaceholder("iconic-history"),
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
}

class VectorStore {
    private vectorStore: FaissStore | null = null;
    private embeddings: HuggingFaceInferenceEmbeddings;
    private directory: string;

    constructor() {
        this.embeddings = new HuggingFaceInferenceEmbeddings({
            model: "sentence-transformers/all-MiniLM-L6-v2",
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

    async reloadData(markdownPath: string) {
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
            this.vectorStore = await FaissStore.fromDocuments(splits, this.embeddings);
            await this.vectorStore.save(this.directory);
            console.log("Vector store created and saved successfully.");
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
}

export { splitMessage, initializeMongoClient, createConversationChain, VectorStore };