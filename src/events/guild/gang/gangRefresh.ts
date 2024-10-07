import { Events, Client, TextChannel, EmbedBuilder, ColorResolvable, GuildMember, Collection } from 'discord.js';
import GangInitSchema from '../../database/schema/gangInit';
import { scheduleJob } from 'node-schedule';
import { BotEvent, IGangInit } from '../../../types';

const CHUNK_SIZE = 1000;
const FETCH_TIMEOUT = 30000;

const fetchAllGangs = async () => await GangInitSchema.find({ gangStatus: true });

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
            { name: 'Members', value: gang.gangMembers.length > 0 ? 
                gang.gangMembers.map(m => `<@${m.userId}>`).join('\n') : 
                'No members'
            }
        )
        .setFooter({ text: `Gang ID: ${gang._id}` })
        .setTimestamp();
};

const fetchGuildMembers = async (guild: any): Promise<Collection<string, GuildMember>> => {
    try {
        const members = new Collection<string, GuildMember>();
        let lastId: string | undefined;
        while (true) {
            const options: any = { limit: CHUNK_SIZE };
            if (lastId) options.after = lastId;

            const chunk = await guild.members.fetch(options);
            if (chunk.size === 0) break;

            chunk.forEach((member: GuildMember) => {
                members.set(member.id, member);
            });

            lastId = chunk.last()?.id;
        }

        return members;
    } catch (error) {
        throw new Error(`Failed to fetch guild members: ${error}`);
    }
};

const updateGangEmbeds = async (client: Client, channelId: string) => {
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        if (!channel) throw new Error('Channel not found');

        const messages = await channel.messages.fetch();
        const gangs = await fetchAllGangs();
        const updatedMessages: string[] = [];

        const guildMembersPromise = fetchGuildMembers(channel.guild);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Member fetch timeout')), FETCH_TIMEOUT)
        );

        const guildMembers = await Promise.race([guildMembersPromise, timeoutPromise])
            .catch(error => {
                client.logger.warn(`Member fetch issue: ${error}. Proceeding with partial data.`);
                return new Collection<string, GuildMember>();
            }) as Collection<string, GuildMember>;

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
        if (!client.config.gang.enabled) return
        setupGangEmbedUpdates(client, client.config.gang.channel.update);
    }
};

export default event;