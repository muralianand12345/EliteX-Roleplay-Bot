import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, Message } from 'discord.js';
import { Command } from '../../types';

const command: Command = {
    name: 'jobapplication',
    description: 'Send job application selectmenu',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        if (!client.config.job.enabled) {
            return await message.channel.send(`${message.guild?.name}'s Job system is currently disabled!`).then((m: Message) => {
                setTimeout(() => m.delete(), 1000 * 5);
            });
        }

        const embed = new EmbedBuilder()
            .setColor('DarkGold')
            .setAuthor({ name: '📝 Job Application Process' })
            .setDescription('```Please select the job category you want to apply for.```')
            .setFooter({ text: client.user?.username || "EliteX RP", iconURL: client.user?.avatarURL() || "" });

        const jobOptions = client.config.job.application.jobtype.map((job: any) => ({
            label: job.name,
            value: job.value,
            emoji: job.emoji
        }));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('job-applicationform-category')
                    .setPlaceholder('Select the job category')
                    .addOptions(jobOptions),
            );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        return await message.delete();
    }
};

export default command;