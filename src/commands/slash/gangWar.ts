import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, ChatInputCommandInteraction, Client, TextChannel } from "discord.js";
import { SlashCommand, GangWarLocation, IGangWar } from "../../types";
import GangWarSchema from "../../events/database/schema/gangWarInitialize";

const command: SlashCommand = {
    cooldown: 5000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName('gangwar')
        .setDescription('Manage gang war (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Get the status of ongoing gang war')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Enable/Disable gang war')
                .addBooleanOption(option =>
                    option
                        .setName('enable')
                        .setDescription('Enable/Disable gang war')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setresult')
                .setDescription('Set the result of gang war')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End an active gang war')
        ),
    async execute(interaction: ChatInputCommandInteraction, client) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const handleStatus = async (interaction: ChatInputCommandInteraction, client: Client) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const gangWars = await GangWarSchema.find({ warStatus: { $in: ['pending', 'active'] } });
                if (gangWars.length === 0) {
                    return interaction.editReply({ content: 'There are no ongoing or upcoming gang wars.' });
                }

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('Gang War Status')
                    .setDescription('Here are the ongoing and upcoming gang wars:');
                gangWars.forEach((war, index) => {
                    const location = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === war.warLocation);
                    embed.addFields({
                        name: `__War ${index + 1}__`,
                        value: `__**Location:**__ ${location?.name || 'Unknown'} ${location?.emoji || ''}\n__**Status:**__ \`${war.warStatus}\`\n__**Combatants:**__ ${war.combatants.map(c => c.gangName).join(' **vs** ')}\n__**Started:**__ ${war.timestamp.toLocaleString()}`
                    });
                });

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('gang-war-view-details')
                            .setLabel('View Details')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });
                const filter = (i: any) => i.customId === 'gang-war-view-details' && i.user.id === interaction.user.id;
                const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 15000 });

                collector?.on('collect', async (i) => {
                    const detailedEmbed = new EmbedBuilder()
                        .setColor('Blue')
                        .setTitle('Detailed Gang War Status');

                    gangWars.forEach((war, index) => {
                        const location = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === war.warLocation);
                        let fieldValue = `__**Location:**__ ${location?.name || 'Unknown'} ${location?.emoji || ''}\n`;
                        fieldValue += `__**Status:**__ ${war.warStatus}\n`;
                        fieldValue += `__**Started:**__ ${war.timestamp.toLocaleString()}\n`;
                        fieldValue += `__**Combatants:**__\n`;
                        war.combatants.forEach(gang => {
                            fieldValue += `- ${gang.gangName} (__**Leader:**__ <@${gang.gangLeader}>)\n`;
                            fieldValue += `  __**Members:**__ \`${gang.gangMembers.length}\`\n`;
                        });
                        detailedEmbed.addFields({ name: `__War ${index + 1}__`, value: fieldValue });
                    });

                    await i.update({ embeds: [detailedEmbed], components: [] });
                });
            } catch (error) {
                client.logger.error('Error fetching gang war status:', error);
                await interaction.editReply({ content: 'An error occurred while fetching gang war status.' });
            }
        };

        const handleSet = async (interaction: ChatInputCommandInteraction, client: Client) => {
            const enable = interaction.options.getBoolean('enable', true);

            try {
                const channel = await interaction.guild?.channels.fetch(client.config.gang.war.channel.war) as TextChannel;
                if (!channel) {
                    return interaction.reply({ content: 'Gang war channel not found.', ephemeral: true });
                }
                await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
                    ViewChannel: enable
                });

                await interaction.reply({ content: `Gang war has been ${enable ? 'enabled' : 'disabled'}.`, ephemeral: true });

            } catch (error) {
                client.logger.error('Error setting gang war status:', error);
                await interaction.reply({ content: 'An error occurred while setting gang war status.', ephemeral: true });
            }
        };

        const handleSetResult = async (interaction: ChatInputCommandInteraction, client: Client) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const activeWars = await GangWarSchema.find({ warStatus: 'active' });

                if (activeWars.length === 0) {
                    return interaction.editReply({ content: 'There are no active gang wars to set results for.' });
                }

                const options = activeWars.map((war, index) => {
                    const location = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === war.warLocation);
                    const warId = war._id as string | number | any;
                    return {
                        label: `War ${index + 1}: ${location?.name || 'Unknown'}`,
                        value: warId.toString()
                    };
                });

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select-war')
                            .setPlaceholder('Select a war to set result')
                            .addOptions(options)
                    );

                await interaction.editReply({ content: 'Select a war to set the result:', components: [row] });

                const filter = (i: any) => i.customId === 'select-war' && i.user.id === interaction.user.id;
                const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 30000 });

                collector?.on('collect', async (i: any) => {
                    const selectedWar = await GangWarSchema.findById(i.values[0]);
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
                    const winnerCollector = interaction.channel?.createMessageComponentCollector({ filter: winnerFilter, time: 30000 });

                    winnerCollector?.on('collect', async (i: any) => {
                        const winnerName = i.values[0];
                        selectedWar.warStatus = 'ended';
                        selectedWar.warEnd = new Date();
                        await selectedWar.save();

                        await i.update({ content: `War result set. Winner: ${winnerName}`, components: [] });

                        const warChannel = await interaction.guild?.channels.fetch(client.config.gang.war.channel.announcement) as TextChannel;
                        if (warChannel) {
                            const embed = new EmbedBuilder()
                                .setColor('Green')
                                .setTitle('Gang War Ended')
                                .setDescription(`The gang war at ${selectedWar.warLocation} has ended.\nWinner: ${winnerName}`);
                            await warChannel.send({ embeds: [embed] });
                        }
                    });
                });

            } catch (error) {
                client.logger.error('Error setting gang war result:', error);
                await interaction.editReply({ content: 'An error occurred while setting gang war result.' });
            }
        };

        const handleEndWar = async (interaction: ChatInputCommandInteraction, client: Client) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const activeWars = await GangWarSchema.find({ warStatus: 'active' });

                if (activeWars.length === 0) {
                    return interaction.editReply({ content: 'There are no active gang wars to end.' });
                }

                const options = activeWars.map((war, index) => {
                    const location = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === war.warLocation);
                    const warId = war._id as string | number | any;
                    return {
                        label: `War ${index + 1}: ${location?.name || 'Unknown'}`,
                        value: warId.toString()
                    };
                });

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select-war-to-end')
                            .setPlaceholder('Select a war to end')
                            .addOptions(options)
                    );

                await interaction.editReply({ content: 'Select a war to end:', components: [row] });
                const filter = (i: any) => i.customId === 'select-war-to-end' && i.user.id === interaction.user.id;
                const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 30000 });

                collector?.on('collect', async (i: any) => {
                    const selectedWar = await GangWarSchema.findById(i.values[0]);
                    if (!selectedWar) {
                        return i.update({ content: 'Selected war not found.', components: [] });
                    }

                    selectedWar.warStatus = 'ended';
                    selectedWar.warEnd = new Date();
                    await selectedWar.save();

                    await i.update({ content: `The gang war at ${selectedWar.warLocation} has been ended without a winner.`, components: [] });

                    const warChannel = await interaction.guild?.channels.fetch(client.config.gang.war.channel.announcement) as TextChannel;
                    if (warChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Gang War Ended')
                            .setDescription(`The gang war at ${selectedWar.warLocation} has been ended by an administrator without a winner.`);
                        await warChannel.send({ embeds: [embed] });
                    }
                });
            } catch (error) {
                client.logger.error('Error ending gang war:', error);
                await interaction.editReply({ content: 'An error occurred while ending the gang war.' });
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