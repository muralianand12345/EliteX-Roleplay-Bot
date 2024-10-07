import { Events, Client, TextChannel, EmbedBuilder, ColorResolvable, GuildMember, Collection } from 'discord.js';
import GangInitSchema from '../../database/schema/gangInit';
import { scheduleJob } from 'node-schedule';
import { BotEvent, IGangInit } from '../../../types';

const CHUNK_SIZE = 1000;
const FETCH_TIMEOUT = 60000; // Increased to 60 seconds
const CHUNK_DELAY = 500; // 500ms delay between chunks
const MAX_RETRIES = 3;

const fetchAllGangs = async () => await GangInitSchema.find({ gangStatus: true });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchMemberChunk = async (guild: any, options: any, retryCount = 0): Promise<Collection<string, GuildMember>> => {
    try {
        const chunk = await guild.members.fetch(options);
        return chunk;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            await delay(1000 * (retryCount + 1)); 
            return fetchMemberChunk(guild, options, retryCount + 1);
        }
        throw error;
    }
};

const fetchGuildMembers = async (guild: any, client: Client, requiredMemberIds: Set<string>): Promise<Collection<string, GuildMember>> => {
    const members = new Collection<string, GuildMember>();
    const chunks: Promise<void>[] = [];
    let lastId: string | undefined;

    requiredMemberIds.forEach(id => {
        const cachedMember = guild.members.cache.get(id);
        if (cachedMember) {
            members.set(id, cachedMember);
            requiredMemberIds.delete(id);
        }
    });

    if (requiredMemberIds.size === 0) {
        return members;
    }

    try {
        while (true) {
            const options: any = { limit: CHUNK_SIZE };
            if (lastId) options.after = lastId;

            const chunkPromise = async () => {
                try {
                    const chunk = await fetchMemberChunk(guild, options);
                    if (chunk.size === 0) return;

                    chunk.forEach((member: GuildMember) => {
                        if (requiredMemberIds.has(member.id)) {
                            members.set(member.id, member);
                        }
                    });

                    lastId = chunk.last()?.id;
                    await delay(CHUNK_DELAY);
                } catch (error) {
                    client.logger.warn(`Chunk fetch error: ${error}. Continuing with partial data.`);
                }
            };

            chunks.push(chunkPromise());
            if (members.size >= requiredMemberIds.size) break;
            await delay(100);
        }

        await Promise.race([
            Promise.all(chunks),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Member fetch timeout')), FETCH_TIMEOUT)
            )
        ]);

    } catch (error) {
        client.logger.warn(`Member fetch partial completion: ${error}`);
    }

    return members;
};

const createGangEmbed = (gang: IGangInit, config: any) => {
    const getLocationNames = (locationValues: string[]) => {
        if (!locationValues || locationValues.length === 0) return 'No Gang Locations';
        return locationValues.map(locationValue => {
            const location = config.gang.war.location.find((loc: any) => loc.value === locationValue);
            return location ? `${location.name} ${location.emoji}` : 'Unknown Location';
        }).join(', ');
    };

    return new EmbedBuilder()
        .setTitle(gang.gangName)
        .setColor(gang.gangColor as ColorResolvable)
        .setThumbnail(gang.gangLogo)
        .addFields(
            { name: 'Leader', value: `<@${gang.gangLeader}>`, inline: true },
            { name: 'Total Members', value: gang.gangMembers.length.toString(), inline: true },
            { name: 'Created', value: gang.gangCreated.toDateString(), inline: true },
            { name: "Status", value: gang.gangStatus ? "Active" : "Inactive", inline: true },
            { name: 'Gang Locations', value: getLocationNames(gang.gangLocation), inline: false },
            {
                name: 'Members', value: gang.gangMembers.length > 0 ?
                    gang.gangMembers.map(m => `<@${m.userId}>`).join('\n') :
                    'No members'
            }
        )
        .setFooter({ text: `Gang ID: ${gang._id}` })
        .setTimestamp();
};

const updateGangEmbeds = async (client: Client, channelId: string) => {
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        if (!channel) throw new Error('Channel not found');

        const messages = await channel.messages.fetch();
        const gangs = await fetchAllGangs();
        const updatedMessages: string[] = [];

        const requiredMemberIds = new Set<string>();
        gangs.forEach(gang => {
            requiredMemberIds.add(gang.gangLeader);
            gang.gangMembers.forEach(member => requiredMemberIds.add(member.userId));
        });

        const guildMembers = await fetchGuildMembers(channel.guild, client, requiredMemberIds);

        for (const gang of gangs) {
            try {
                gang.gangMembers = gang.gangMembers.filter(member =>
                    guildMembers.has(member.userId)
                );

                await GangInitSchema.findByIdAndUpdate(gang._id, {
                    gangMembers: gang.gangMembers
                });

                const embed = createGangEmbed(gang, client.config);
                const existingMessage = messages.find(m =>
                    m.embeds[0]?.footer?.text === `Gang ID: ${gang._id}`
                );

                if (existingMessage) {
                    await existingMessage.edit({ embeds: [embed] });
                    updatedMessages.push(existingMessage.id);
                } else {
                    const newMessage = await channel.send({ embeds: [embed] });
                    updatedMessages.push(newMessage.id);
                }

                await delay(1000);
            } catch (error) {
                client.logger.error(`Error updating gang ${gang.gangName}: ${error}`);
            }
        }

        const messagesToDelete = messages.filter(message =>
            !updatedMessages.includes(message.id)
        );

        for (const message of messagesToDelete.values()) {
            await message.delete().catch(error =>
                client.logger.warn(`Failed to delete message ${message.id}: ${error}`)
            );
        }
    } catch (error) {
        client.logger.error(`Error updating gang embeds: ${error}`);
        throw error;
    }
};

const setupGangEmbedUpdates = (client: Client, channelId: string) => {
    updateGangEmbeds(client, channelId).catch(error =>
        client.logger.error(`Failed initial gang embed update: ${error}`)
    );
    scheduleJob('*/5 * * * *', () => {
        updateGangEmbeds(client, channelId).catch(error =>
            client.logger.error(`Failed scheduled gang embed update: ${error}`)
        );
    });
};

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {
        if (!client.config.gang.enabled) return;
        setupGangEmbedUpdates(client, client.config.gang.channel.update);
    }
};

export default event;