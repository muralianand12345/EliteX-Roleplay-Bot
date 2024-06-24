import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, Role } from "discord.js";

import ageDeclarationModal from "../../database/schema/ageDeclaration";
import { BotEvent } from "../../../types";

const hasRole = (member: GuildMember, role: Role) => {
    return member.roles.cache.has(role.id);
}

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        if (!interaction.guild) return;

        if (!interaction.customId.includes('age-category')) return;

        var ageDeclarationData = await ageDeclarationModal.findOne({
            guildId: interaction.guild.id
        });

        if (!ageDeclarationData) return;
        if (!ageDeclarationData.status) return;

        const above18Role = await interaction.guild.roles.cache.find((x: Role) => x.id === ageDeclarationData?.above18) as Role;
        const below18Role = await interaction.guild.roles.cache.find((x: Role) => x.id === ageDeclarationData?.below18) as Role;
        if (!above18Role || !below18Role) return;

        if (interaction.customId == "age-category") {
            await interaction.deferReply({ ephemeral: true });
            const checkAboveRole = hasRole(interaction.member, above18Role);
            const checkBelowRole = hasRole(interaction.member, below18Role);

            ageDeclarationData.count = ageDeclarationData.count + 1;
            await ageDeclarationData.save();

            if (checkAboveRole || checkBelowRole) return await interaction.editReply({ content: "Action denied! You already have age role" });

            const ageCategory = interaction.values[0];
            if (ageCategory === "above-18") {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setImage(client.config.agedeclaration.above18Img);
                const button = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('age-category-above-button-verify')
                            .setLabel('18 +')
                            .setStyle(ButtonStyle.Success)
                    );
                await interaction.editReply({ embeds: [embed], components: [button] });
            }
            if (ageCategory === "below-18") {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setImage(client.config.agedeclaration.below18Img);
                const button = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('age-category-below-button-verify')
                            .setLabel('18 -')
                            .setStyle(ButtonStyle.Success)
                    );
                await interaction.editReply({ embeds: [embed], components: [button] });
            }
        };


        if (interaction.customId == "age-category-above-button-verify") {
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

        if (interaction.customId == "age-category-below-button-verify") {
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
    }
};

export default event;