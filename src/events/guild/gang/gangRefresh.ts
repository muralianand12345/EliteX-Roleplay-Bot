import { Events, Client, TextChannel, EmbedBuilder, ColorResolvable, GuildMember } from 'discord.js';
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
        { name: 'Total Members', value: gang.gangMembers.length.toString(), inline: true },
        { name: 'Created', value: gang.gangCreated.toDateString(), inline: true },
        { name: "Status", value: gang.gangStatus ? "Active" : "Inactive", inline: true },
        { name: 'Members', value: gang.gangMembers.map(m => `<@${m.userId}>`).join('\n') }
    )
    .setFooter({ text: `Gang ID: ${gang._id}` })
    .setTimestamp();

const updateGangEmbeds = async (client: Client, channelId: string) => {
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        if (!channel) return;

        const messages = await channel.messages.fetch();
        const gangs = await fetchAllGangs();

        const updatedMessages: string[] = [];

        for (const gang of gangs) {
            const guildMembers = await channel.guild.members.fetch();
            gang.gangMembers = gang.gangMembers.filter(member => 
                guildMembers.has(member.userId)
            );

            await GangInitSchema.findByIdAndUpdate(gang._id, { gangMembers: gang.gangMembers });

            const embed = createGangEmbed(gang);

            const existingMessage = messages.find(m => m.embeds[0]?.footer?.text === `Gang ID: ${gang._id}`);
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
    scheduleJob('*/5 * * * *', () => updateGangEmbeds(client, channelId));
};

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {
        if (!client.config.gang.enabled) return
        setupGangEmbedUpdates(client, client.config.gang.channel.update);
    }
};

export default event;