import path from 'path';
import { config } from 'dotenv';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { UnstructuredLoader } from "@langchain/community/document_loaders/fs/unstructured";

import { Command } from '../../types';

config();

const command: Command = {
    name: 'reloadai',
    description: 'Reload the AI chatbot\' data',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const markdownPath = path.join(__dirname, '..', '..', '..', 'vector-store', 'data', 'server_info.md');
        const storagePath = path.join(__dirname, '..', '..', '..', 'vector-store');

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
        const vectorStore = await FaissStore.fromDocuments(
            splits,
            new HuggingFaceInferenceEmbeddings({ apiKey: process.env.HUGGINGFACEHUB_API_KEY })
        );
        await vectorStore.save(storagePath);

        await message.reply({ content: 'AI data reloaded!' });
    },
}

export default command;