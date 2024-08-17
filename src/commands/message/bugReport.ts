import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { Command } from '../../types';

const command: Command = {
    name: 'bugreport',
    description: "Sends a bug report embed",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setAuthor({ name: client.user?.username || "EliteX RP", iconURL: client.user?.displayAvatarURL() || "" })
            .setDescription("```Bug Report```")
            .setFooter({ text: "Please describe the bug you found" });

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bug-report')
                    .setLabel('Bug Report')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        return await message.delete();
    }
};

export default command;