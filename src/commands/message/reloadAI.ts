import path from 'path';
import { config } from 'dotenv';
import { VectorStore } from '../../utils/ai/ai_functions';

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

        await message.channel.sendTyping();

        const markdownPath = path.join(__dirname, '..', '..', '..', 'vector-store', 'data', 'server_info.md');

        const vectorStore = new VectorStore(client);
        await vectorStore.initialize();

        try {
            const override = args[0] === '--override';
            await vectorStore.reloadData(markdownPath, override);
            await message.reply({ content: 'AI data reloaded successfully!' });
        } catch (error: Error | any) {
            client.logger.error(`Error reloading AI data: ${error}`);
            await message.reply({ content: 'An error occurred while reloading AI data!' });
        }
    },
}

export default command;