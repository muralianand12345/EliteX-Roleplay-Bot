import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { Command } from '../../types';

const command: Command = {
    name: 'getvisaform',
    description: 'Send visa button',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setAuthor({ name: client.user?.username || "Iconic RP", iconURL: client.user?.displayAvatarURL() })
            .setDescription("```Get Visa Holder Role```");

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('visa-get')
                    .setLabel('Visa Holder')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        return await message.delete();
    }
};

export default command;