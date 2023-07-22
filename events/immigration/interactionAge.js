const {
    Events,
    ComponentType
} = require('discord.js');

const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        async function hasRole(userMem, roleId) {
            const hasRole = userMem.roles.cache.has(roleId);
            if (hasRole) {
                return true;
            } else {
                return false
            }
        }

        const BroleID = client.immigration.AGE.BROLE;
        const Brole = await interaction.guild.roles.cache.find(x => x.id === BroleID);

        const AroleID = client.immigration.AGE.AROLE;
        const Arole = await interaction.guild.roles.cache.find(x => x.id === AroleID);

        if (interaction.customId == "below-button-verify") {
            if (interaction.member.roles.cache?.has(BroleID)) {
                await interaction.member.roles.remove(Brole).then(() => {
                    interaction.reply({ content: "Below 18 Role Removed!", ephemeral: true });
                });
            } else {
                await interaction.member.roles.add(Brole).then(() => {
                    interaction.reply({ content: "Below 18 Role Added!", ephemeral: true });
                });
            }
            return await interaction.member.roles.remove(Drole);
        }

        if (interaction.customId == "above-button-verify") {
            if (interaction.member.roles.cache?.has(AroleID)) {
                await interaction.member.roles.remove(Arole).then(() => {
                    interaction.reply({ content: "Above 18 Role Removed!", ephemeral: true });
                });
            } else {
                await interaction.member.roles.add(Arole).then(() => {
                    interaction.reply({ content: "Above 18 Role Added!", ephemeral: true });
                });
            }
        }

        if (interaction.customId == "disclaimer-button") {

            if (!Arole || !Brole) return interaction.reply({ content: "Error Occured! Try Again. || Error Code: Role-26", ephemeral: true });
            const Abool = await hasRole(interaction.member, AroleID);
            const Bbool = await hasRole(interaction.member, BroleID);

            if (Abool || Bbool) {
                return interaction.reply({ content: "Action denied! You already have age role", ephemeral: true });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#206694')
                    .setDescription('Select Your Age Group Below')
                    .setFooter({ text: 'Valid for 30 seconds only' })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('age-category')
                            .setPlaceholder('Select Your Age!')
                            .addOptions([
                                {
                                    label: 'Above 18',
                                    value: 'above-18',
                                    emoji: '👨',
                                },
                                {
                                    label: 'Below 18',
                                    value: 'below-18',
                                    emoji: '👶',
                                }
                            ]),
                    );

                msg = await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });

                const collector = await msg.createMessageComponentCollector({
                    componentType: ComponentType.SelectMenu,
                    time: 30000,
                    max: 1
                });

                collector.on('collect', async (i) => {
                    if (i.user.id === interaction.user.id) {

                        if (i.values[0] == 'above-18') {

                            const embed = new EmbedBuilder()
                                .setColor('Green')
                                .setImage('https://cdn.discordapp.com/attachments/1097420467532472340/1102470374702190623/18.png')
                            const button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('above-button-verify')
                                        .setLabel('18 +')
                                        .setStyle(ButtonStyle.Success)
                                )

                            i.reply({ embeds: [embed], components: [button], ephemeral: true });
                        }

                        if (i.values[0] == 'below-18') {

                            const embed = new EmbedBuilder()
                                .setColor('Green')
                                .setImage('https://cdn.discordapp.com/attachments/1097420467532472340/1102472300181331978/18-.png')
                            const button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('below-button-verify')
                                        .setLabel('18 -')
                                        .setStyle(ButtonStyle.Success)
                                )

                            i.reply({ embeds: [embed], components: [button], ephemeral: true });
                        }
                    }
                });

                collector.on('end', async (collected) => {
                    if (collected.size < 1) {
                        interaction.editReply({
                            content: 'Session expired! Click button and claim again.',
                            embeds: [],
                            components: [],
                            ephemeral: true
                        });
                    }
                });
            }
        }
    }
}