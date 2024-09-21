import { Events, ButtonInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, TextChannel } from "discord.js";
import GangInitSchema from "../../database/schema/gangInit";
import GangZonalWarSchema from "../../database/schema/gangZonalWarInitialize";
import { BotEvent, IGangZonalWarCombatants, GangZonalWarLocation } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const handleGangInitiate = async (interaction: ButtonInteraction) => {
            if (!client.config.gang.zonalwar.enabled) {
                return interaction.reply({ content: "Gang zonal war is disabled.", ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
                if (!gangData) {
                    return interaction.editReply({ content: "You are not a gang leader." });
                }
                if (!gangData.gangStatus) {
                    return interaction.editReply({ content: "Gang is not initialized!" });
                }

                const activeGangZonalWars = await GangZonalWarSchema.find({ warStatus: 'active' });
                const availableLocations = client.config.gang.zonalwar.location.filter((location: GangZonalWarLocation) => {
                    const warAtLocation = activeGangZonalWars.find(war => war.warLocation === location.value);
                    return !warAtLocation || warAtLocation.combatants.length < client.config.gang.zonalwar.maxcombatants;
                });

                if (availableLocations.length === 0) {
                    return interaction.editReply({ content: "No locations available for gang zonalwar at the moment. Try again later." });
                }

                const gangLocationOptions = availableLocations.map((location: GangZonalWarLocation) => ({
                    label: location.name,
                    value: location.value,
                    emoji: location.emoji
                }));

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('gang-zonal-war-select-location')
                            .setPlaceholder('Select a location')
                            .addOptions(gangLocationOptions)
                    );

                await interaction.editReply({
                    content: "Select a location for the gang zonal war.",
                    components: [row]
                });
            } catch (error) {
                client.logger.error('Error fetching gang data:', error);
                return interaction.editReply({ content: "An error occurred while fetching data. Try again later." });
            }
        };

        const handleGangSelectLocation = async (interaction: StringSelectMenuInteraction) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
                if (!gangData) {
                    return interaction.editReply({ content: "You are not a gang leader." });
                }
                if (!gangData.gangStatus) {
                    return interaction.editReply({ content: "Gang is not initialized!" });
                }
                if (gangData.gangMembers.length < client.config.gang.zonalwar.mingangmembers) {
                    return interaction.editReply({ content: `You need at least ${client.config.gang.zonalwar.mingangmembers} members to start a gang zonal war.` });
                }

                const existingGangZonalWar = await GangZonalWarSchema.findOne({ 'combatants.gangName': gangData.gangName, warStatus: 'active' });
                if (existingGangZonalWar) {
                    return interaction.editReply({ content: "Your gang is already in an active war." });
                }

                if (!client.config.gang.zonalwar.location.some((location: any) => location.value === interaction.values[0])) {
                    return interaction.editReply({ content: "Invalid location." });
                }

                const selectedLocation = interaction.values[0];
                const gangZonalWarLocation = client.config.gang.zonalwar.location.find((location: any) => location.value === selectedLocation);

                let gangZonalWar = await GangZonalWarSchema.findOne({ warLocation: selectedLocation, warStatus: 'active' });

                if (gangZonalWar) {
                    if (gangZonalWar.combatants.length >= client.config.gang.zonalwar.maxcombatants) {
                        return interaction.editReply({ content: "This location has reached the maximum number of combatants." });
                    }

                    gangZonalWar.combatants.push({
                        gangName: gangData.gangName,
                        gangLeader: gangData.gangLeader,
                        gangLogo: gangData.gangLogo,
                        gangRole: gangData.gangRole,
                        gangMembers: gangData.gangMembers
                    });

                    await gangZonalWar.save();
                } else {
                    gangZonalWar = new GangZonalWarSchema({
                        warLocation: selectedLocation,
                        combatants: [{
                            gangName: gangData.gangName,
                            gangLeader: gangData.gangLeader,
                            gangLogo: gangData.gangLogo,
                            gangRole: gangData.gangRole,
                            gangMembers: gangData.gangMembers
                        }],
                        warStatus: 'active'
                    });

                    await gangZonalWar.save();
                }

                const adminChan = await interaction.guild?.channels.fetch(client.config.bot.adminChannel) as TextChannel;
                if (adminChan) {
                    const embed = new EmbedBuilder()
                        .setColor('Grey')
                        .setAuthor({ name: client.user?.username || "EliteX RP", iconURL: client.user?.displayAvatarURL() })
                        .setTitle('🔫 Gang Zonal War')
                        .setDescription(`Gang zonal war ${gangZonalWar.combatants.length === 1 ? 'initiated' : 'joined'} at ${gangZonalWarLocation.name} by **${gangData.gangName}**.`);

                    await adminChan.send({ embeds: [embed] });
                }

                await interaction.editReply({
                    content: `Your gang has ${gangZonalWar.combatants.length === 1 ? 'initiated' : 'joined'} the gang zonal war at ${gangZonalWarLocation.name}.`,
                    components: []
                });
            } catch (error) {
                client.logger.error('Error handling gang zonal war location selection:', error);
                return interaction.editReply({ content: "An error occurred while processing your request. Try again later." });
            }
        }

        switch (interaction.customId) {
            case 'gang-zonal-war-initiate': {
                handleGangInitiate(interaction);
                break;
            }
            case 'gang-zonal-war-select-location': {
                handleGangSelectLocation(interaction);
                break;
            }
        }
    }
};

export default event;