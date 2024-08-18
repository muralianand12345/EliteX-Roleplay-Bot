import { Events, Client, TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';
import GangInitSchema from '../../database/schema/gangInit';
import { scheduleJob } from 'node-schedule';
import { BotEvent, IGangInit } from '../../../types';

const fetchAllGangs = async () => await GangInitSchema.find({ gangStatus: true });

const createGangEmbed = (gang: IGangInit) => new EmbedBuilder()
    .setTitle(gang.gangName)
    .setColor(gang.gangColor as ColorResolvable)
    .setThumbnail(gang.gangLogo)
    .addFields(
        { name: 'Leader', value: `<@${gang.gangLeader}>`, inline: true },
        { name: 'Members', value: gang.gangMembers.length.toString(), inline: true },
        { name: 'Created', value: gang.gangCreated.toDateString(), inline: true }
    )
    .setFooter({ text: `Gang ID: ${gang._id}` });

const updateGangEmbeds = async (client: Client, channelId: string) => {
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        if (!channel) return;

        const messages = await channel.messages.fetch();
        const gangs = await fetchAllGangs();

        const updatedMessages: string[] = [];

        for (const [index, gang] of gangs.entries()) {
            const embed = createGangEmbed(gang);

            const existingMessage = messages.at(index);
            if (existingMessage) {
                await existingMessage.edit({ embeds: [embed] });
                updatedMessages.push(existingMessage.id);
            } else {
                const newMessage = await channel.send({ embeds: [embed] });
                updatedMessages.push(newMessage.id);
            }
        }

        const messagesToDelete = messages.filter(message => !updatedMessages.includes(message.id));
        for (const message of messagesToDelete.values()) {
            await message.delete();
        }
    } catch (error) {
        client.logger.error(`Error updating gang embeds: ${error}`);
    }
};

const setupGangEmbedUpdates = (client: Client, channelId: string) => {
    updateGangEmbeds(client, channelId);
    // scheduleJob('0 * * * *', () => updateGangEmbeds(client, channelId));
    scheduleJob('*/1 * * * *', () => updateGangEmbeds(client, channelId));
};

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {
        if (!client.config.gang.enabled) return
        setupGangEmbedUpdates(client, client.config.gang.channel.update);
    }
};

export default event;