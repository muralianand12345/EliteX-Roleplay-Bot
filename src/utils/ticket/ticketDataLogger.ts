import fs from 'fs/promises';
import path from 'path';
import { Message } from "discord.js";
import { client } from '../../bot';

const writeTicketLog = async (guildId: string, userId: string, ticketId: string, messages: Message[]) => {
    const logDir = path.join(__dirname, '../../../ticket-user-data', guildId, userId);
    const logFile = path.join(logDir, `${ticketId}.log`);
    await fs.mkdir(logDir, { recursive: true });

    const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const logContent = sortedMessages.map(msg => 
        `[${msg.createdAt.toISOString()}] [${msg.author.id} | ${msg.author.username}] ${msg.content}`
    ).join('\n');

    try {
        await fs.writeFile(logFile, logContent, 'utf-8');
    } catch (error) {
        client.logger.error('Error writing ticket log:', error);
    }
    
}

export { writeTicketLog };