import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, ChatInputCommandInteraction, Client, TextChannel, Role } from "discord.js";
import { SlashCommand, GangZonalWarLocation, IGangZonalWar } from "../../types";
import GangZonalWarSchema from "../../events/database/schema/gangZonalWarInitialize";

const command: SlashCommand = {
    cooldown: 5000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName('gangzonalwar')
        .setDescription('Manage gang zonal war (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Get the status of ongoing gang zonal war')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Enable/Disable gang zonal war')
                .addBooleanOption(option =>
                    option
                        .setName('enable')
                        .setDescription('Enable/Disable gang zonal war')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setresult')
                .setDescription('Set the result of gang zonal war')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End an active gang zonal war')
        ),
    async execute(interaction: ChatInputCommandInteraction, client) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const handleStatus = async (interaction: ChatInputCommandInteraction, client: Client) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const gangZonalWars = await GangZonalWarSchema.find({ warStatus: { $in: ['pending', 'active'] } });
                if (gangZonalWars.length === 0) {
                    return interaction.editReply({ content: 'There are no ongoing or upcoming gang zonal wars.' });
                }

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('Gang Zonal War Status')
                    .setDescription('Here are the ongoing and upcoming gang zonal wars:');
                gangZonalWars.forEach((war, index) => {
                    const location = client.config.gang.zonalwar.location.find((loc: GangZonalWarLocation) => loc.value === war.warLocation);
                    embed.addFields({
                        name: `__War ${index + 1}__`,
                        value: `**Location:** ${location?.name || 'Unknown'} ${location?.emoji || ''}\**Status:** \`${war.warStatus}\`\**Combatants:** ${war.combatants.map(c => c.gangName).join(' **vs** ')}\**Started:** ${war.timestamp.toLocaleString()}`
                    });
                });

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('gang-zonal-war-view-details')
                            .setLabel('View Details')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });
                const filter = (i: any) => i.customId === 'gang-zonal-war-view-details' && i.user.id === interaction.user.id;
                const chan = interaction.channel as TextChannel;
                const collector = chan?.createMessageComponentCollector({ filter, time: 15000 });

                collector?.on('collect', async (i) => {
                    const detailedEmbed = new EmbedBuilder()
                        .setColor('Blue')
                        .setTitle('Detailed Gang Zonal War Status');

                    gangZonalWars.forEach((war, index) => {
                        const location = client.config.gang.zonalwar.location.find((loc: GangZonalWarLocation) => loc.value === war.warLocation);
                        let fieldValue = `**Location:** ${location?.name || 'Unknown'} ${location?.emoji || ''}\n`;
                        fieldValue += `**Status:** \`${war.warStatus}\`\n`;
                        fieldValue += `**Started:** ${war.timestamp.toLocaleString()}\n`;
                        fieldValue += `**Combatants:**\n`;
                        war.combatants.forEach(gang => {
                            fieldValue += `- ${gang.gangName} (**Leader:** <@${gang.gangLeader}>)\n`;
                            fieldValue += `  **Members:** \`${gang.gangMembers.length}\`\n`;
                        });
                        detailedEmbed.addFields({ name: `__War ${index + 1}__`, value: fieldValue });
                    });

                    await i.update({ embeds: [detailedEmbed], components: [] });
                });
            } catch (error) {
                client.logger.error('Error fetching gang zonal war status:', error);
                await interaction.editReply({ content: 'An error occurred while fetching gang zonal war status.' });
            }
        };

        const handleSet = async (interaction: ChatInputCommandInteraction, client: Client) => {
            const enable = interaction.options.getBoolean('enable', true);

            try {
                const channel = await interaction.guild?.channels.fetch(client.config.gang.zonalwar.channel.war) as TextChannel;
                if (!channel) {
                    return interaction.reply({ content: 'Gang zonal war channel not found.', ephemeral: true });
                }

                const role = await interaction.guild?.roles.fetch(client.config.visaform.role.visa) as Role;
                if (!role) {
                    return interaction.reply({ content: 'Error occured, Visa role not found.', ephemeral: true });
                }

                await channel.permissionOverwrites.edit(role, {
                    ViewChannel: enable
                });

                await interaction.reply({ content: `Gang zonal war has been ${enable ? 'enabled' : 'disabled'}.`, ephemeral: true });

            } catch (error) {
                client.logger.error('Error setting gang zonal war status:', error);
                await interaction.reply({ content: 'An error occurred while setting gang zonal war status.', ephemeral: true });
            }
        };

        const handleSetResult = async (interaction: ChatInputCommandInteraction, client: Client) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const activeWars = await GangZonalWarSchema.find({ warStatus: 'active' });

                if (activeWars.length === 0) {
                    return interaction.editReply({ content: 'There are no active gang zonal wars to set results for.' });
                }

                const options = activeWars.map((war, index) => {
                    const location = client.config.gang.zonalwar.location.find((loc: GangZonalWarLocation) => loc.value === war.warLocation);
                    const warId = war._id as string | number | any;
                    return {
                        label: `War ${index + 1}: ${location?.name || 'Unknown'}`,
                        value: warId.toString()
                    };
                });

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select-zonal-war')
                            .setPlaceholder('Select a war to set result')
                            .addOptions(options)
                    );

                await interaction.editReply({ content: 'Select a war to set the result:', components: [row] });

                const filter = (i: any) => i.customId === 'select-zonal-war' && i.user.id === interaction.user.id;
                const chan = interaction.channel as TextChannel;
                const collector = chan?.createMessageComponentCollector({ filter, time: 30000 });

                collector?.on('collect', async (i: any) => {
                    const selectedWar = await GangZonalWarSchema.findById(i.values[0]);
                    if (!selectedWar) {
                        return i.update({ content: 'Selected war not found.', components: [] });
                    }

                    const winnerOptions = selectedWar.combatants.map(gang => ({
                        label: gang.gangName,
                        value: gang.gangName
                    }));

                    const winnerRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('select-winner')
                                .setPlaceholder('Select the winning gang')
                                .addOptions(winnerOptions)
                        );

                    await i.update({ content: 'Select the winning gang:', components: [winnerRow] });

                    const winnerFilter = (i: any) => i.customId === 'select-winner' && i.user.id === interaction.user.id;
                    const chan2 = interaction.channel as TextChannel;
                    const winnerCollector = chan2?.createMessageComponentCollector({ filter: winnerFilter, time: 30000 });

                    winnerCollector?.on('collect', async (i: any) => {
                        const winnerName = i.values[0];
                        selectedWar.warStatus = 'ended';
                        selectedWar.warEnd = new Date();
                        await selectedWar.save();

                        await i.update({ content: `War result set. Winner: ${winnerName}`, components: [] });

                        const warChannel = await interaction.guild?.channels.fetch(client.config.gang.zonalwar.channel.announcement) as TextChannel;
                        if (warChannel) {
                            const embed = new EmbedBuilder()
                                .setColor('Green')
                                .setTitle('Gang Zonal War Ended')
                                .setDescription(`The gang zonal war at ${selectedWar.warLocation} has ended.\nWinner: ${winnerName}`);
                            await warChannel.send({ embeds: [embed] });
                        }
                    });
                });

            } catch (error) {
                client.logger.error('Error setting gang zonal war result:', error);
                await interaction.editReply({ content: 'An error occurred while setting gang zonal war result.' });
            }
        };

        const handleEndWar = async (interaction: ChatInputCommandInteraction, client: Client) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const activeWars = await GangZonalWarSchema.find({ warStatus: 'active' });

                if (activeWars.length === 0) {
                    return interaction.editReply({ content: 'There are no active gang zonal wars to end.' });
                }

                const options = activeWars.map((war, index) => {
                    const location = client.config.gang.zonalwar.location.find((loc: GangZonalWarLocation) => loc.value === war.warLocation);
                    const warId = war._id as string | number | any;
                    return {
                        label: `War ${index + 1}: ${location?.name || 'Unknown'}`,
                        value: warId.toString()
                    };
                });

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select-zonal-war-to-end')
                            .setPlaceholder('Select a war to end')
                            .addOptions(options)
                    );

                await interaction.editReply({ content: 'Select a war to end:', components: [row] });
                const filter = (i: any) => i.customId === 'select-zonal-war-to-end' && i.user.id === interaction.user.id;
                const chan = interaction.channel as TextChannel;
                const collector = chan?.createMessageComponentCollector({ filter, time: 30000 });

                collector?.on('collect', async (i: any) => {
                    const selectedWar = await GangZonalWarSchema.findById(i.values[0]);
                    if (!selectedWar) {
                        return i.update({ content: 'Selected war not found.', components: [] });
                    }

                    selectedWar.warStatus = 'ended';
                    selectedWar.warEnd = new Date();
                    await selectedWar.save();

                    await i.update({ content: `The gang zonal war at ${selectedWar.warLocation} has been ended without a winner.`, components: [] });

                    const warChannel = await interaction.guild?.channels.fetch(client.config.gang.zonalwar.channel.announcement) as TextChannel;
                    if (warChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Gang Zonal War Ended')
                            .setDescription(`The gang zonal war at ${selectedWar.warLocation} has been ended by an administrator without a winner.`);
                        await warChannel.send({ embeds: [embed] });
                    }
                });
            } catch (error) {
                client.logger.error('Error ending gang zonal war:', error);
                await interaction.editReply({ content: 'An error occurred while ending the gang zonal war.' });
            }
        };


        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'status':
                await handleStatus(interaction, client);
                break;
            case 'set':
                await handleSet(interaction, client);
                break;
            case 'setresult':
                await handleSetResult(interaction, client);
                break;
            case 'end':
                await handleEndWar(interaction, client);
                break;
        }
    }
};

export default command;