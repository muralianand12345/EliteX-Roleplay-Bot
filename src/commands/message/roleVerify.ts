import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { Command } from '../../types';

const command: Command = {
    name: 'getvisaform',
    description: 'Send visa application button',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('#4B0082')
            .setAuthor({ name: client.user?.username || "EliteX RP", iconURL: client.user?.displayAvatarURL() })
            .setTitle('🛂 Visa Application Process')
            .setDescription("Welcome to EliteX RP! To join our community, you'll need to apply for a visa. Click the button below to start your application.")
            .addFields(
                { name: '📝 Application Steps', value: '1. Click the "Apply for Visa" button\n2. Fill out the application form\n3. Submit and wait for review' },
                { name: '⏳ Processing Time', value: 'Applications are typically reviewed within 24-48 hours.' },
                { name: '📌 Important Note', value: 'Please ensure all information provided is accurate and detailed.' }
            )
            .setImage('https://cdn.discordapp.com/attachments/1273688228469280788/1274058841721405531/2-Transparent.png');

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('visa-application')
                    .setLabel('Apply for Visa')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✈️')
            );

        const chan = message.channel as TextChannel;
        await chan.send({
            embeds: [embed],
            components: [row]
        });

        return await message.delete();
    }
};

export default command;