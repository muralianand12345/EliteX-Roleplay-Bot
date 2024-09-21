import { EmbedBuilder, ActionRowBuilder, Message, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { Command } from '../../types';

const command: Command = {
    name: 'jobapplication',
    description: 'Send job application selectmenu',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const chan = message.channel as TextChannel;

        if (!client.config.job.enabled) {
            return await chan.send(`${message.guild?.name}'s Job system is currently disabled!`).then((m: Message) => {
                setTimeout(() => m.delete(), 1000 * 5);
            });
        }

        const embed = new EmbedBuilder()
            .setColor('DarkGold')
            .setAuthor({ name: '📝 Job Application Process' })
            .setDescription('```Click the "Apply Job" button to start your application.```')
            .setFooter({ text: client.user?.username || "EliteX RP", iconURL: client.user?.avatarURL() || "" });

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('job-application') 
                    .setLabel('Apply Job')
                    .setStyle(ButtonStyle.Primary)
            );  
        
        await chan.send({
            embeds: [embed],
            components: [row]
        });

        return await message.delete();
    }
};

export default command;