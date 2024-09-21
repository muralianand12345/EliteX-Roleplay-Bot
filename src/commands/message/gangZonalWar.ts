import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { Command } from '../../types';

const command: Command = {
    name: 'initgangzonalwar',
    description: "Starts a zonal gang war.",
    cooldown: 1000,
    owner: true,
    userPerms: [],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const embed = new EmbedBuilder()
            .setColor('Grey')
            .setAuthor({ name: client.user?.username || "EliteX RP", iconURL: client.user?.displayAvatarURL() })
            .setTitle('🔫 Gang War')
            .setDescription(`Initiate Gang Zonal War by clicking the button below.`);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('gang-zonal-war-initiate')
                    .setLabel('Gang Zonal War')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔫')
            );

        const chan = client.channels.cache.get(client.config.gang.zonalwar.channel.war) as TextChannel;
        await chan.send({
            embeds: [embed],
            components: [row]
        });

        return await message.delete();
    }
};

export default command;