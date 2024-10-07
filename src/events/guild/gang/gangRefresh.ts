import { 
    Events, 
    Client, 
    TextChannel, 
    EmbedBuilder, 
    ColorResolvable, 
    GuildMember, 
    Collection,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction
} from 'discord.js';
import GangInitSchema from '../../database/schema/gangInit';
import { scheduleJob } from 'node-schedule';
import { BotEvent, IGangInit } from '../../../types';

const CHUNK_SIZE = 1000;
const FETCH_TIMEOUT = 30000;
const MEMBERS_PER_PAGE = 10;
const BUTTON_TIMEOUT = 300000; // 5 minutes

const fetchAllGangs = async () => await GangInitSchema.find({ gangStatus: true });

const formatMemberDisplay = (userId: string, guildMembers: Collection<string, GuildMember>): string => {
    const member = guildMembers.get(userId);
    if (!member) return `<@${userId}>`;
    return `<@${userId}> | ${member.user.username}`;
};

const createMembersDisplay = (
    members: Array<{ userId: string }>, 
    guildMembers: Collection<string, GuildMember>,
    page: number
): [string, number] => {
    if (members.length === 0) return ['No members', 1];

    const totalPages = Math.ceil(members.length / MEMBERS_PER_PAGE);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
    const endIndex = Math.min(startIndex + MEMBERS_PER_PAGE, members.length);

    const displayMembers = members
        .slice(startIndex, endIndex)
        .map(m => formatMemberDisplay(m.userId, guildMembers))
        .join('\n');

    return [displayMembers, totalPages];
};

const createButtons = (currentPage: number, totalPages: number, gangId: string) => {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prev_${gangId}_${currentPage}`)
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage <= 1),
            new ButtonBuilder()
                .setCustomId(`next_${gangId}_${currentPage}`)
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage >= totalPages)
        );

    return row;
};

const createGangEmbed = (
    gang: IGangInit, 
    config: any, 
    guildMembers: Collection<string, GuildMember>,
    page: number = 1
) => {
    const getLocationNames = (locationValues: string[]) => {
        if (!locationValues || locationValues.length === 0) return 'No Gang Locations';
        return locationValues.map(locationValue => {
            const location = config.gang.war.location.find((loc: any) => loc.value === locationValue);
            return location ? `${location.name} ${location.emoji}` : 'Unknown Location';
        }).join(', ');
    };

    const leaderDisplay = formatMemberDisplay(gang.gangLeader, guildMembers);
    const [membersDisplay, totalPages] = createMembersDisplay(gang.gangMembers, guildMembers, page);

    const embed = new EmbedBuilder()
        .setTitle(gang.gangName)
        .setColor(gang.gangColor as ColorResolvable)
        .setThumbnail(gang.gangLogo)
        .addFields(
            { name: 'Leader', value: leaderDisplay, inline: true },
            { name: 'Total Members', value: gang.gangMembers.length.toString(), inline: true },
            { name: 'Created', value: gang.gangCreated.toDateString(), inline: true },
            { name: "Status", value: gang.gangStatus ? "Active" : "Inactive", inline: true },
            { name: 'Gang Locations', value: getLocationNames(gang.gangLocation), inline: false },
            { 
                name: `Members (Page ${page}/${totalPages})`, 
                value: membersDisplay,
                inline: false 
            }
        )
        .setFooter({ text: `Gang ID: ${gang._id}` })
        .setTimestamp();

    return { embed, totalPages };
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

const handleButtonClick = async (
    interaction: ButtonInteraction,
    client: Client,
    guildMembers: Collection<string, GuildMember>
) => {
    const [action, gangId, currentPage] = interaction.customId.split('_');
    const page = parseInt(currentPage);
    
    const gang = await GangInitSchema.findById(gangId);
    if (!gang) {
        await interaction.reply({ content: 'Gang not found.', ephemeral: true });
        return;
    }

    const newPage = action === 'next' ? page + 1 : page - 1;
    const { embed, totalPages } = createGangEmbed(gang, client.config, guildMembers, newPage);
    const buttons = createButtons(newPage, totalPages, gangId);

    await interaction.update({ embeds: [embed], components: [buttons] });
};

const updateGangEmbeds = async (client: Client, channelId: string) => {
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        if (!channel) {
            throw new Error('Channel not found');
        }

        const messages = await channel.messages.fetch();
        const gangs = await fetchAllGangs();
        const updatedMessages: string[] = [];

        const guildMembers = await Promise.race([
            fetchGuildMembers(channel.guild),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Member fetch timeout')), FETCH_TIMEOUT))
        ]).catch(error => {
            client.logger.warn(`Member fetch issue: ${error}. Proceeding with partial data.`);
            return new Collection<string, GuildMember>();
        }) as Collection<string, GuildMember>;

        for (const gang of gangs) {
            try {
                const gangId = gang._id as string;
                gang.gangMembers = gang.gangMembers.filter(member => 
                    guildMembers.has(member.userId)
                );

                await GangInitSchema.findByIdAndUpdate(gang._id, { 
                    gangMembers: gang.gangMembers 
                });

                const { embed, totalPages } = createGangEmbed(gang, client.config, guildMembers, 1);
                const buttons = createButtons(1, totalPages, gangId);

                const existingMessage = messages.find(m => 
                    m.embeds[0]?.footer?.text === `Gang ID: ${gang._id}`
                );

                if (existingMessage) {
                    await existingMessage.edit({ 
                        embeds: [embed], 
                        components: totalPages > 1 ? [buttons] : [] 
                    });
                    updatedMessages.push(existingMessage.id);
                } else {
                    const newMessage = await channel.send({ 
                        embeds: [embed], 
                        components: totalPages > 1 ? [buttons] : [] 
                    });
                    updatedMessages.push(newMessage.id);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
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

const setupButtonCollector = (client: Client, channelId: string) => {
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (!channel) return;

    const collector = channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: BUTTON_TIMEOUT
    });

    collector.on('collect', async interaction => {
        if (!interaction.isButton()) return;

        try {
            const guildMembers = await fetchGuildMembers(interaction.guild!);
            await handleButtonClick(interaction, client, guildMembers);
        } catch (error) {
            client.logger.error(`Error handling button interaction: ${error}`);
            await interaction.reply({ 
                content: 'An error occurred while processing your request.', 
                ephemeral: true 
            });
        }
    });

    collector.on('end', () => {
        setupButtonCollector(client, channelId);
    });
};

const setupGangEmbedUpdates = (client: Client, channelId: string) => {
    setupButtonCollector(client, channelId);

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