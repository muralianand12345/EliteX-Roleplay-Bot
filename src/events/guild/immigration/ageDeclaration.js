const {
    Events,
} = require('discord.js');

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ageDeclarationModal = require('../../database/modals/ageDeclarationRole.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        if (!interaction.guild) return;

        var ageDeclarationData = await ageDeclarationModal.findOne({
            guildID: interaction.guild.id
        });

        if (!ageDeclarationData) return;
        if (!ageDeclarationData.status) return;

        const above18Role = await interaction.guild.roles.cache.find(x => x.id === ageDeclarationData.above18);
        const below18Role = await interaction.guild.roles.cache.find(x => x.id === ageDeclarationData.below18);

        async function hasRole(member, roleId) {
            const hasRole = member.roles.cache.has(roleId);
            if (hasRole) {
                return true;
            } else {
                return false
            }
        }

        if (interaction.customId == "below-button-verify") {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.member.roles.cache?.has(below18Role.id)) {
                await interaction.member.roles.remove(below18Role.id).then(async () => {
                    await interaction.editReply({ content: "Below 18 Role Removed!", ephemeral: true });
                });
            } else {
                await interaction.member.roles.add(below18Role.id).then(async () => {
                    await interaction.editReply({ content: "Below 18 Role Added!", ephemeral: true });
                });
            }
        }

        if (interaction.customId == "above-button-verify") {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.member.roles.cache?.has(above18Role.id)) {
                await interaction.member.roles.remove(above18Role.id).then(async () => {
                    await interaction.editReply({ content: "Above 18 Role Removed!", ephemeral: true });
                });
            } else {
                await interaction.member.roles.add(above18Role.id).then(async () => {
                    await interaction.editReply({ content: "Above 18 Role Added!", ephemeral: true });
                });
            }
        }

        if (interaction.customId == "age-category") {
            await interaction.deferReply({ ephemeral: true });
            if (!above18Role || !below18Role) return await interaction.editReply({ content: "Error Occured! Try Again. || Error Code: Role-26", ephemeral: true });
            const Abool = await hasRole(interaction.member, above18Role.id);
            const Bbool = await hasRole(interaction.member, below18Role.id);

            ageDeclarationData.count = ageDeclarationData.count + 1;
            await ageDeclarationData.save();

            if (Abool || Bbool) {
                return await interaction.editReply({ content: "Action denied! You already have age role", ephemeral: true });
            } else {
                const ageCategory = interaction.values[0];
                if (ageCategory === "above-18") {
                    const embed = new EmbedBuilder()
                        .setColor('Green')
                        .setImage(client.config.agedeclaration.above18Img)
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
                        .setImage(client.config.agedeclaration.below18Img)
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