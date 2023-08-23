const {
    Events,
} = require('discord.js');

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        if (!interaction.guild) return;
        if (interaction.guild.id !== client.visa.GUILDID) return;

        const BroleID = client.immigration.AGE.BROLE;
        const Brole = await interaction.guild.roles.cache.find(x => x.id === BroleID);

        const AroleID = client.immigration.AGE.AROLE;
        const Arole = await interaction.guild.roles.cache.find(x => x.id === AroleID);

        async function hasRole(userMem, roleId) {
            const hasRole = userMem.roles.cache.has(roleId);
            if (hasRole) {
                return true;
            } else {
                return false
            }
        }

        if (interaction.customId == "below-button-verify") {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.member.roles.cache?.has(BroleID)) {
                await interaction.member.roles.remove(Brole).then(async() => {
                    await interaction.editReply({ content: "Below 18 Role Removed!", ephemeral: true });
                });
            } else {
                await interaction.member.roles.add(Brole).then(async() => {
                    await interaction.editReply({ content: "Below 18 Role Added!", ephemeral: true });
                });
            }
        }

        if (interaction.customId == "above-button-verify") {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.member.roles.cache?.has(AroleID)) {
                await interaction.member.roles.remove(Arole).then(async() => {
                    await interaction.editReply({ content: "Above 18 Role Removed!", ephemeral: true });
                });
            } else {
                await interaction.member.roles.add(Arole).then(async() => {
                    await interaction.editReply({ content: "Above 18 Role Added!", ephemeral: true });
                });
            }
        }

        if (interaction.customId == "age-category") {
            await interaction.deferReply({ ephemeral: true });
            if (!Arole || !Brole) return await interaction.editReply({ content: "Error Occured! Try Again. || Error Code: Role-26", ephemeral: true });
            const Abool = await hasRole(interaction.member, AroleID);
            const Bbool = await hasRole(interaction.member, BroleID);

            if (Abool || Bbool) {
                return await interaction.editReply({ content: "Action denied! You already have age role", ephemeral: true });
            } else {

                const ageCategory = interaction.values[0];
                if (ageCategory === "above-18") {
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
                    await interaction.editReply({ embeds: [embed], components: [button], ephemeral: true });
                }

                if (ageCategory === "below-18") {
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
                    await interaction.editReply({ embeds: [embed], components: [button], ephemeral: true });
                }
            }
        }
    }
}