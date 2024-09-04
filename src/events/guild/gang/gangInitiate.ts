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

                const gangLocationOptions = client.config.gang.war.location.map((location: GangWarLocation) => ({
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
                    return interaction.editReply({ content: `You need atleast ${client.config.gang.war.mingangmembers} members to start a gang war.` });
                }

                const gangWar = await GangWarSchema.findOne({ 'combatants.gangName': gangData.gangName });
                if (gangWar) {
                    if (gangWar.warStatus === 'active' || gangWar.warStatus === 'pending') {
                        return interaction.editReply({ content: "Your gang is already in war or has chosen the location." });
                    }
                }

                if (!client.config.gang.war.location.some((location: any) => location.value === interaction.values[0])) {
                    return interaction.editReply({ content: "Invalid location." });
                }

                const gangWarLocationTaken = await GangWarSchema.findOne({ warLocation: interaction.values[0] });
                if (gangWarLocationTaken && gangWarLocationTaken.combatants.length >= client.config.gang.war.maxcombatants) {
                    return interaction.editReply({ content: "Location is already taken." });
                }

                const gangWarLocation = client.config.gang.war.location.find((location: any) => location.value === interaction.values[0]);

                const combatants: Array<IGangWarCombatants> = [{
                    gangName: gangData.gangName,
                    gangLeader: gangData.gangLeader,
                    gangLogo: gangData.gangLogo,
                    gangRole: gangData.gangRole,
                    gangMembers: gangData.gangMembers
                }];

                const newGangWar = new GangWarSchema({
                    warLocation: gangWarLocation.value,
                    combatants: combatants
                });

                await newGangWar.save();

                const adminChan = await interaction.guild?.channels.fetch(client.config.bot.adminChannel) as TextChannel;
                if (adminChan) {
                    const embed = new EmbedBuilder()
                        .setColor('Grey')
                        .setAuthor({ name: client.user?.username || "EliteX RP", iconURL: client.user?.displayAvatarURL() })
                        .setTitle('🔫 Gang War')
                        .setDescription(`Gang war initiated at ${gangWarLocation.name} by **${gangData.gangName}**.`);

                    await adminChan.send({ embeds: [embed] });
                }

                await interaction.editReply({ content: `Gang war initiated at ${gangWarLocation.name}.`, components: [] });
            } catch (error) {
                client.logger.error('Error fetching gang data:', error);
                return interaction.editReply({ content: "An error occurred while fetching data. Try again later." });
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