import fs from 'fs/promises';
import path from 'path';
import { Message } from "discord.js";
import { client } from '../../bot';

const writeTicketLog = async (guildId: string, userId: string, ticketId: string, messages: Message[]) => {
    try {
        const logDir = path.join(__dirname, '../../../ticket-user-data', guildId, userId);
        const logFile = path.join(logDir, `${ticketId}.log`);
        await fs.mkdir(logDir, { recursive: true });

        const logContent = messages.map(msg => {
            let content = `[${msg.createdAt.toISOString()}] [${msg.author.id} | ${msg.author.username}] ${msg.content}`;

            if (msg.embeds.length > 0) {
                content += '\nEmbeds:';
                msg.embeds.forEach((embed, index) => {
                    content += `\n  Embed ${index + 1}:`;
                    if (embed.title) content += `\n    Title: ${embed.title}`;
                    if (embed.description) content += `\n    Description: ${embed.description}`;
                    if (embed.fields.length > 0) {
                        content += '\n    Fields:';
                        embed.fields.forEach(field => {
                            content += `\n      ${field.name}: ${field.value}`;
                        });
                    }
                    if (embed.footer) content += `\n    Footer: ${embed.footer.text}`;
                    if (embed.image) content += `\n    Image: ${embed.image.url}`;
                    if (embed.thumbnail) content += `\n    Thumbnail: ${embed.thumbnail.url}`;
                    if (embed.author) content += `\n    Author: ${embed.author.name}`;
                    if (embed.url) content += `\n    URL: ${embed.url}`;
                });
            }

            return content;
        }).join('\n\n');

        if (logContent.length === 0) {
            client.logger.info('No messages to write');
            return;
        }

        await fs.writeFile(logFile, logContent, 'utf-8');
        client.logger.info(`Ticket log written successfully: ${logFile}`);
    } catch (error) {
        client.logger.error('Error writing ticket log:', error);
    }
}

export { writeTicketLog };