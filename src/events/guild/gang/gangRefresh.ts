import { Events, Client, TextChannel, EmbedBuilder, ColorResolvable, GuildMember } from 'discord.js';
import GangInitSchema from '../../database/schema/gangInit';
import { scheduleJob } from 'node-schedule';
import { BotEvent, IGangInit } from '../../../types';

const fetchAllGangs = async () => await GangInitSchema.find({ gangStatus: true });

const createGangEmbed = (gang: IGangInit, config: any) => {
    const getLocationNames = (locationValues: string[]) => {
        if (!locationValues || locationValues.length === 0) return 'No Gang Locations';
        return locationValues.map(locationValue => {
            const location = config.gang.war.location.find((loc: any) => loc.value === locationValue);
            return location ? `${location.name} ${location.emoji}` : 'Unknown Location';
        }).join(', ');
    };

    const gangLeader = gang.gangLeader ? `<@${gang.gangLeader}>` : 'Unknown';
    const totalMembers = gang.gangMembers?.length?.toString() || '0';
    const gangCreated = gang.gangCreated ? gang.gangCreated.toDateString() : 'Unknown';
    const gangLocations = getLocationNames(gang.gangLocation ?? []);
    const gangMembers = gang.gangMembers.length > 0 
        ? gang.gangMembers.map(m => `<@${m.userId}> | \`${m.username}\`${m.isActive ? '' : ' (**InActive**)'}`).join('\n') 
        : 'No Members';

    return new EmbedBuilder()
        .setTitle(gang.gangName)
        .setColor(gang.gangColor as ColorResolvable)
        .setThumbnail(gang.gangLogo)
        .addFields(
            { name: 'Leader', value: gangLeader, inline: true },
            { name: 'Total Members', value: totalMembers, inline: true },
            { name: 'Created', value: gangCreated, inline: true },
            { name: "Status", value: gang.gangStatus ? "Active" : "Inactive", inline: true },
            { name: 'Gang Locations', value: gangLocations, inline: false },
            { name: 'Members', value: gangMembers, inline: false }
        )
        .setFooter({ text: `Gang ID: ${gang._id}` })
        .setTimestamp();
};

const updateGangEmbeds = async (client: Client, channelId: string) => {
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        if (!channel) return;

        const messages = await channel.messages.fetch();
        const gangs = await fetchAllGangs();

        const updatedMessages: string[] = [];

        for (const gang of gangs) {
            const guildMembers = await channel.guild.members.fetch().catch(error => {
                client.logger.error(`Error fetching guild members: ${error.message || error}`);
                return new Map<string, GuildMember>();
            });

            gang.gangMembers = gang.gangMembers.map(member => ({
                ...member,
                isActive: guildMembers.has(member.userId)
            }));

            try {
                await GangInitSchema.findByIdAndUpdate(gang._id, { gangMembers: gang.gangMembers });
            } catch (dbError: Error | any) {
                client.logger.error(`Database update error for Gang ID ${gang._id}: ${dbError.message || dbError}`);
            }

            const embed = createGangEmbed(gang, client.config);

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
    } catch (error: Error | any) {
        client.logger.error(`Error updating gang embeds: ${error.message || error}`);
        if (error.stack) {
            client.logger.error(error.stack);
        }
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