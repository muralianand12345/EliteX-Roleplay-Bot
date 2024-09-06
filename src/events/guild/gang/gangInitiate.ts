import { Events, ButtonInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, TextChannel } from "discord.js";
import GangInitSchema from "../../database/schema/gangInit";
import GangWarSchema from "../../database/schema/gangWarInitialize";
import { BotEvent, IGangWarCombatants, GangWarLocation } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const handleGangInitiate = async (interaction: ButtonInteraction) => {
            if (!client.config.gang.war.enabled) {
                return interaction.reply({ content: "Gang war is disabled.", ephemeral: true });
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

                const activeGangWars = await GangWarSchema.find({ warStatus: 'active' });
                const availableLocations = client.config.gang.war.location.filter((location: GangWarLocation) => {
                    const warAtLocation = activeGangWars.find(war => war.warLocation === location.value);
                    return !warAtLocation || warAtLocation.combatants.length < client.config.gang.war.maxcombatants;
                });

                if (availableLocations.length === 0) {
                    return interaction.editReply({ content: "No locations available for gang war at the moment. Try again later." });
                }

                const gangLocationOptions = availableLocations.map((location: GangWarLocation) => ({
                    label: location.name,
                    value: location.value,
                    emoji: location.emoji
                }));

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('gang-war-select-location')
                            .setPlaceholder('Select a location')
                            .addOptions(gangLocationOptions)
                    );

                await interaction.editReply({
                    content: "Select a location for the gang war.",
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
                if (gangData.gangMembers.length < client.config.gang.war.mingangmembers) {
                    return interaction.editReply({ content: `You need at least ${client.config.gang.war.mingangmembers} members to start a gang war.` });
                }

                const existingGangWar = await GangWarSchema.findOne({ 'combatants.gangName': gangData.gangName, warStatus: 'active' });
                if (existingGangWar) {
                    return interaction.editReply({ content: "Your gang is already in an active war." });
                }

                if (!client.config.gang.war.location.some((location: any) => location.value === interaction.values[0])) {
                    return interaction.editReply({ content: "Invalid location." });
                }

                const selectedLocation = interaction.values[0];
                const gangWarLocation = client.config.gang.war.location.find((location: any) => location.value === selectedLocation);

                let gangWar = await GangWarSchema.findOne({ warLocation: selectedLocation, warStatus: 'active' });

                if (gangWar) {
                    if (gangWar.combatants.length >= client.config.gang.war.maxcombatants) {
                        return interaction.editReply({ content: "This location has reached the maximum number of combatants." });
                    }

                    gangWar.combatants.push({
                        gangName: gangData.gangName,
                        gangLeader: gangData.gangLeader,
                        gangLogo: gangData.gangLogo,
                        gangRole: gangData.gangRole,
                        gangMembers: gangData.gangMembers
                    });

                    await gangWar.save();
                } else {
                    gangWar = new GangWarSchema({
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

                    await gangWar.save();
                }

                const adminChan = await interaction.guild?.channels.fetch(client.config.bot.adminChannel) as TextChannel;
                if (adminChan) {
                    const embed = new EmbedBuilder()
                        .setColor('Grey')
                        .setAuthor({ name: client.user?.username || "EliteX RP", iconURL: client.user?.displayAvatarURL() })
                        .setTitle('🔫 Gang War')
                        .setDescription(`Gang war ${gangWar.combatants.length === 1 ? 'initiated' : 'joined'} at ${gangWarLocation.name} by **${gangData.gangName}**.`);

                    await adminChan.send({ embeds: [embed] });
                }

                await interaction.editReply({
                    content: `Your gang has ${gangWar.combatants.length === 1 ? 'initiated' : 'joined'} the gang war at ${gangWarLocation.name}.`,
                    components: []
                });
            } catch (error) {
                client.logger.error('Error handling gang war location selection:', error);
                return interaction.editReply({ content: "An error occurred while processing your request. Try again later." });
            }
        }

        switch (interaction.customId) {
            case 'gang-war-initiate': {
                handleGangInitiate(interaction);
                break;
            }
            case 'gang-war-select-location': {
                handleGangSelectLocation(interaction);
                break;
            }
        }
    }
};

export default event;