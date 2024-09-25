import { Events, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, TextChannel, User } from "discord.js";
import GangInitSchema from "../../database/schema/gangInit";
import GangWarSchema from "../../database/schema/gangWar";
import { BotEvent, GangWarLocation, IGangWarCombatants } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const getLocationName = (locationValue: string): string => {
            const location = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === locationValue);
            return location ? location.name : locationValue;
        };

        const sendDM = async (user: User, content: string) => {
            try {
                await user.send(content);
            } catch (error) {
                client.logger.error(`Failed to send DM to ${user.tag}:`, error);
            }
        };

        const sendAnnouncement = async (client: any, embed: EmbedBuilder) => {
            const announcementChannelId = client.config.gang.war.channel.announcement;
            const announcementChannel = await client.channels.fetch(announcementChannelId) as TextChannel;
            if (announcementChannel) {
                await announcementChannel.send({ embeds: [embed] });
            }
        };

        const updateLoserLocation = async (loserGang: IGangWarCombatants | undefined, location: string) => {
            if (loserGang) {
                const gangInit = await GangInitSchema.findOne({ gangLeader: loserGang.gangLeader });
                if (gangInit) {
                    gangInit.gangLocation = gangInit.gangLocation.filter(loc => loc !== location);
                    await gangInit.save();
                }
            }
        };

        const announceGangWar = async (client: any, gangWar: any) => {
            const attackerGang = gangWar.combatants.find((c: IGangWarCombatants) => c.type === 'attacker');
            const defenderGang = gangWar.combatants.find((c: IGangWarCombatants) => c.type === 'defender');
            const locationName = getLocationName(gangWar.location);

            const embed = new EmbedBuilder()
                .setTitle('⚔️ Gang War Initiated! ⚔️')
                .setDescription(`The streets are about to ignite! A new gang war has been **initiated**.`)
                .setColor('Orange')
                .addFields(
                    { name: '🗺️ Location', value: `**${locationName}**` },
                    { name: '💥 Attacker', value: `**${attackerGang.gangName}**`, inline: true },
                    { name: '🛡️ Defender', value: `**${defenderGang.gangName}**`, inline: true },
                    { name: '⚠️ Status', value: '**Pending**' }
                )
                .setFooter({ text: `${gangWar._id.toString()}` })
                .setTimestamp();

            await sendAnnouncement(client, embed);
        };

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

                const existingWars = await GangWarSchema.find({
                    "combatants.gangLeader": interaction.user.id,
                    warStatus: { $in: ['active', 'pending'] }
                });

                const attackCount = existingWars.filter(war =>
                    war.combatants.some(c => c.gangLeader === interaction.user.id && c.type === 'attacker')
                ).length;

                const defenseCount = existingWars.filter(war =>
                    war.combatants.some(c => c.gangLeader === interaction.user.id && c.type === 'defender')
                ).length;

                if (attackCount >= 1 && defenseCount >= 1) {
                    return interaction.editReply({
                        content: "Your gang is already involved in one attack and one defense. You can't initiate or defend another war."
                    });
                }

                if (attackCount >= 1) {
                    return interaction.editReply({
                        content: "Your gang is already attacking another gang. You cannot initiate another war."
                    });
                }

                if (defenseCount >= 1) {
                    return interaction.editReply({
                        content: "Your gang is already defending against an attack. You cannot be attacked by another gang."
                    });
                }

                const otherGangs = await GangInitSchema.find({
                    gangLeader: { $ne: interaction.user.id },
                    gangLocation: { $ne: [] }
                });
                if (!otherGangs.length) {
                    return interaction.editReply({ content: "No other gangs available for war." });
                }

                const activeWars = await GangWarSchema.find({ warStatus: { $in: ['active', 'pending'] } });
                const activeWarLocations = activeWars.map(war => war.location);

                const availableLocations = client.config.gang.war.location
                    .filter((location: GangWarLocation) => {
                        return (
                            !activeWarLocations.includes(location.value) &&
                            otherGangs.some(gang => gang.gangLocation.includes(location.value))
                        );
                    })
                    .map((location: GangWarLocation) => ({
                        label: location.name,
                        value: location.value,
                        emoji: location.emoji
                    }));

                if (availableLocations.length === 0) {
                    return interaction.editReply({ content: "No locations available for gang war at the moment. Try again later." });
                }

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('gang-war-select-location')
                            .setPlaceholder('Select a location')
                            .addOptions(availableLocations)
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

                const selectedLocation = interaction.values[0];
                const gangWarData = await GangWarSchema.findOne({ location: selectedLocation, warStatus: { $in: ['pending', 'active'] } });
                if (gangWarData) {
                    return interaction.editReply({ content: "Gang war is already active or pending at this location." });
                }

                const existingWars = await GangWarSchema.find({
                    "combatants.gangLeader": interaction.user.id,
                    warStatus: { $in: ['pending', 'active'] }
                });

                const attackCount = existingWars.filter(war =>
                    war.combatants.some(c => c.gangLeader === interaction.user.id && c.type === 'attacker')
                ).length;

                const defenseCount = existingWars.filter(war =>
                    war.combatants.some(c => c.gangLeader === interaction.user.id && c.type === 'defender')
                ).length;

                if (attackCount >= 1 && defenseCount >= 1) {
                    return interaction.editReply({
                        content: "Your gang is already involved in one attack and one defense. You cannot initiate or defend another war."
                    });
                }

                const defendingGangData = await GangInitSchema.findOne({ gangLocation: selectedLocation });
                if (!defendingGangData) {
                    return interaction.editReply({ content: "No gang owns this location." });
                }

                const defendingGangWar = await GangWarSchema.findOne({
                    "combatants.gangLeader": defendingGangData.gangLeader,
                    warStatus: { $in: ['pending', 'active'] }
                });

                if (defendingGangWar) {
                    return interaction.editReply({
                        content: "The defending gang is already defending against an attack. You cannot attack them again."
                    });
                }

                const newGangWar = new GangWarSchema({
                    location: selectedLocation,
                    combatants: [
                        {
                            gangName: gangData.gangName,
                            gangLeader: gangData.gangLeader,
                            gangLogo: gangData.gangLogo,
                            gangRole: gangData.gangRole,
                            gangMembers: gangData.gangMembers,
                            type: 'attacker'
                        },
                        {
                            gangName: defendingGangData.gangName,
                            gangLeader: defendingGangData.gangLeader,
                            gangLogo: defendingGangData.gangLogo,
                            gangRole: defendingGangData.gangRole,
                            gangMembers: defendingGangData.gangMembers,
                            type: 'defender'
                        }
                    ],
                    warStatus: 'pending'
                });

                await newGangWar.save();

                const attackerLeader = await client.users.fetch(gangData.gangLeader);
                const defenderLeader = await client.users.fetch(defendingGangData.gangLeader);
                const locationName = getLocationName(selectedLocation);
                await sendDM(attackerLeader, `Your gang has initiated a war against **${defendingGangData.gangName}** for the location: **${locationName}**. Prepare for battle!`);
                await sendDM(defenderLeader, `Your gang is under attack! **${gangData.gangName}** has initiated a war for your location: **${locationName}**. Defend your territory!`);

                await announceGangWar(client, newGangWar);

                const gangWarId = newGangWar._id as string | number;
                const adminChannel = await client.channels.fetch(client.config.bot.adminChannel) as TextChannel;
                const embed = new EmbedBuilder()
                    .setTitle('🔥 Gang War Initiated 🔥')
                    .setDescription(`A gang war has been initiated between **${gangData.gangName}** and **${defendingGangData.gangName}** at **${getLocationName(selectedLocation)}**!`)
                    .setColor('Orange')
                    .addFields(
                        { name: '⚔️ Attacker', value: `\`${gangData.gangName}\``, inline: true },
                        { name: '🛡️ Defender', value: `\`${defendingGangData.gangName}\``, inline: true },
                        { name: '📍 Location', value: `\`${getLocationName(selectedLocation)}\``, inline: false }
                    )
                    .setFooter({ text: `${gangWarId.toString()}` })
                    .setTimestamp();

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('gang-war-start')
                            .setLabel('Start War')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔫')
                    );

                await adminChannel.send({
                    embeds: [embed],
                    components: [row]
                });

                return interaction.editReply({ content: "Gang war initiated! Waiting for admin approval." });

            } catch (error) {
                client.logger.error('Error fetching gang data:', error);
                return interaction.editReply({ content: "An error occurred while fetching data. Try again later." });
            }
        };

        const handleGangWarStart = async (interaction: ButtonInteraction) => {
            await interaction.deferUpdate();

            const gangWarId = interaction.message.embeds[0].footer?.text;
            if (!gangWarId) {
                return interaction.followUp({ content: "Unable to find gang war ID.", ephemeral: true });
            }

            const gangWar = await GangWarSchema.findById(gangWarId);
            if (!gangWar) {
                return interaction.followUp({ content: "Gang war not found.", ephemeral: true });
            }

            gangWar.warStatus = 'active';
            gangWar.warStart = new Date();
            await gangWar.save();

            const attackerGang = gangWar.combatants.find(c => c.type === 'attacker');
            const defenderGang = gangWar.combatants.find(c => c.type === 'defender');

            const embed = new EmbedBuilder()
                .setTitle('🔫 Gang War In Progress! 🔫')
                .setDescription(`The battle between **${attackerGang?.gangName}** and **${defenderGang?.gangName}** has begun at **${getLocationName(gangWar.location)}**!`)
                .setColor('Red')
                .addFields(
                    { name: '🗡️ Attacker', value: `**${attackerGang?.gangName || 'Unknown'}**`, inline: true },
                    { name: '🛡️ Defender', value: `**${defenderGang?.gangName || 'Unknown'}**`, inline: true }
                )
                .setFooter({ text: `${gangWarId}` })
                .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gang-war-winner-${attackerGang?.gangLeader}`)
                        .setLabel(`${attackerGang?.gangName} Wins`)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🏆'),
                    new ButtonBuilder()
                        .setCustomId(`gang-war-winner-${defenderGang?.gangLeader}`)
                        .setLabel(`${defenderGang?.gangName} Wins`)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🏆'),
                    new ButtonBuilder()
                        .setCustomId('gang-war-winner-draw')
                        .setLabel('Draw')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🤝')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });

            await sendAnnouncement(client, embed);
        };

        const handleGangWarWinner = async (interaction: ButtonInteraction) => {
            await interaction.deferUpdate();

            const gangWarId = interaction.message.embeds[0].footer?.text;
            if (!gangWarId) {
                return interaction.followUp({ content: "Unable to find gang war ID.", ephemeral: true });
            }

            const gangWar = await GangWarSchema.findById(gangWarId);
            if (!gangWar) {
                return interaction.followUp({ content: "Gang war not found.", ephemeral: true });
            }

            const winnerGangLeader = interaction.customId.split('-')[3];
            const isDraw = winnerGangLeader === 'draw';

            gangWar.warStatus = 'ended';
            gangWar.warEnd = new Date();
            await gangWar.save();

            const attackerGang = gangWar.combatants.find(c => c.type === 'attacker');
            const defenderGang = gangWar.combatants.find(c => c.type === 'defender');

            let winnerGang, loserGang;
            if (!isDraw) {
                winnerGang = gangWar.combatants.find(c => c.gangLeader === winnerGangLeader);
                loserGang = gangWar.combatants.find(c => c.gangLeader !== winnerGangLeader);

                if (winnerGang) {
                    const gangInit = await GangInitSchema.findOne({ gangLeader: winnerGang.gangLeader });
                    if (gangInit) {
                        gangInit.warWon = (gangInit.warWon || 0) + 1;
                        if (!gangInit.gangLocation.includes(gangWar.location)) {
                            gangInit.gangLocation.push(gangWar.location);
                        }
                        await gangInit.save();
                    }
                }

                if (loserGang) {
                    const gangInit = await GangInitSchema.findOne({ gangLeader: loserGang.gangLeader });
                    if (gangInit) {
                        gangInit.gangLocation = gangInit.gangLocation.filter(loc => loc !== gangWar.location);
                        await gangInit.save();
                    }
                }
            }

            const locationName = getLocationName(gangWar.location);

            const embed = new EmbedBuilder()
                .setTitle('🏁 Gang War Ended 🏁')
                .setDescription(`The fierce gang war at **${locationName}** has officially concluded!`)
                .setColor(isDraw ? 'Grey' : 'Green')
                .addFields(
                    { name: '⚔️ Attacker', value: `\`${attackerGang?.gangName || 'Unknown'}\``, inline: true },
                    { name: '🛡️ Defender', value: `\`${defenderGang?.gangName || 'Unknown'}\``, inline: true },
                    { name: '🏆 Result', value: isDraw ? '**It\'s a Draw!** 🤝' : `**${winnerGang?.gangName} Wins** 🎉`, inline: false },
                    { name: '📅 Duration', value: `${Math.round((new Date().getTime() - new Date(gangWar.warStart || 0).getTime()) / (1000 * 60))} minutes`, inline: true },
                    { name: '📍 Location', value: `${locationName}`, inline: true }
                )
                .setFooter({ text: `${gangWarId}` })
                .setTimestamp();


            await interaction.editReply({
                embeds: [embed],
                components: []
            });

            const attackerLeader = await client.users.fetch(attackerGang?.gangLeader);
            const defenderLeader = await client.users.fetch(defenderGang?.gangLeader);

            if (isDraw) {
                sendDM(attackerLeader, `Your gang war at \`${locationName}\` ended in a **draw**.`);
                sendDM(defenderLeader, `Your gang war at \`${locationName}\` ended in a **draw**.`);
            } else {
                const winnerLeader = winnerGang?.gangLeader === attackerGang?.gangLeader ? attackerLeader : defenderLeader;
                const loserLeader = winnerGang?.gangLeader === attackerGang?.gangLeader ? defenderLeader : attackerLeader;

                sendDM(winnerLeader, `Congratulations! Your gang won the war at \`${locationName}\`. This **location has been added** to your territory.`);
                sendDM(loserLeader, `Your gang lost the war at \`${locationName}\`. This **location has been removed** from your territory.`);
            }

            await sendAnnouncement(client, embed);
        };

        switch (interaction.customId) {
            case 'gang-war-initiate':
                return handleGangInitiate(interaction);
            case 'gang-war-select-location':
                return handleGangSelectLocation(interaction);
            case 'gang-war-start':
                return handleGangWarStart(interaction);
            case 'gang-war-winner-draw':
                return handleGangWarWinner(interaction);
            default:
                if (interaction.customId && interaction.customId.startsWith('gang-war-winner-')) {
                    return handleGangWarWinner(interaction);
                }
                return;
        }
    }
};

export default event;