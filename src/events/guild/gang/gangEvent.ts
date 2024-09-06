import { ButtonInteraction, ColorResolvable, Events, PermissionsBitField } from "discord.js";
import GangInitSchema from "../../database/schema/gangInit";
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const handleAdminApproval = async (interaction: ButtonInteraction) => {
            if (!(interaction.member && 'permissions' in interaction.member && interaction.member.permissions instanceof PermissionsBitField)) {
                return interaction.reply({ content: "Unable to verify permissions.", ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: "You don't have permission to approve gangs.", ephemeral: true });
            }

            const gangLeaderId = interaction.message.embeds[0]?.fields?.find(f => f.name === "Gang Leader ID")?.value;
            if (!gangLeaderId) {
                return interaction.reply({ content: "Gang Leader ID not found in the message.", ephemeral: true });
            }

            const gangColor = interaction.message.embeds[0]?.fields?.find(f => f.name === "Gang Color")?.value;
            if (!gangColor) {
                return interaction.reply({ content: "Gang Color not found in the message.", ephemeral: true });
            }

            const gangData = await GangInitSchema.findOne({ gangLeader: gangLeaderId });
            if (!gangData) {
                return interaction.reply({ content: "Gang not found.", ephemeral: true });
            }

            if (interaction.customId === 'approve-gang') {
                try {
                    const role = await interaction.guild?.roles.create({
                        name: gangData.gangName,
                        color: gangColor as ColorResolvable,
                        permissions: [],
                        reason: "Gang role"
                    });

                    if (!role) {
                        return interaction.reply({ content: "Unable to create role.", ephemeral: true });
                    }

                    gangData.gangStatus = true;
                    gangData.gangRole = role.id;
                    await gangData.save();

                    const leader = await interaction.guild?.members.fetch(gangData.gangLeader);
                    if (leader) {
                        await leader.roles.add(role);
                    }

                    for (const member of gangData.gangMembers) {
                        const guildMember = await interaction.guild?.members.fetch(member.userId);
                        if (guildMember) {
                            await guildMember.roles.add(role);
                        }
                    }

                    const leaderUser = await client.users.fetch(gangData.gangLeader);
                    await leaderUser.send(`Your gang **${gangData.gangName}** has been approved!`);

                    await interaction.update({ content: "Gang approved and roles assigned!", components: [] });
                } catch (error) {
                    client.logger.error("Error approving gang:", error);
                    await interaction.reply({ content: "An error occurred while approving the gang.", ephemeral: true });
                }
            } else if (interaction.customId === 'reject-gang') {
                const leaderUser = await client.users.fetch(gangData.gangLeader);
                await leaderUser.send(`Your gang **${gangData.gangName}** has been rejected.`);
                await GangInitSchema.findOneAndDelete({ gangLeader: gangLeaderId });
                await interaction.update({ content: "Gang rejected and deleted.", components: [] });
            }
        };

        const handleGangDisband = async (interaction: ButtonInteraction) => {
            await interaction.deferReply({ ephemeral: true });

            try {
                const gangId = interaction.message.embeds[0].footer?.text;
                if (!gangId) {
                    return interaction.reply({ content: "Gang ID not found in the message.", ephemeral: true });
                }

                const gangData = await GangInitSchema.findById(gangId);
                if (!gangData) {
                    return interaction.reply({ content: "Gang not found.", ephemeral: true });
                }

                if (interaction.customId === 'approve-gang-disband') {
                    const role = interaction.guild?.roles.cache.get(gangData.gangRole);
                    if (role) {
                        await role.delete();
                    }

                    const leaderUser = await client.users.fetch(gangData.gangLeader);
                    await leaderUser.send(`Your gang **${gangData.gangName}** has been disbanded.`);

                    await GangInitSchema.findByIdAndDelete(gangId);
                    await interaction.editReply({ content: "Gang disbanded and role deleted." });

                } else if (interaction.customId === 'reject-gang-disband') {
                    const leaderUser = await client.users.fetch(gangData.gangLeader);
                    await leaderUser.send(`Your gang disband request has been rejected.`);

                    await interaction.editReply({ content: "Gang disband request rejected." });
                } else {
                    return interaction.editReply({ content: "Invalid interaction." });
                }

            } catch (error) {
                client.logger.error("Error disbanding gang:", error);
                await interaction.editReply({ content: "An error occurred while disbanning the gang." });
            }

            if (!interaction.isButton()) return;

            if (interaction.customId === 'approve-gang' || interaction.customId === 'reject-gang') {
                await handleAdminApproval(interaction);
            } else if (interaction.customId === 'approve-gang-disband' || interaction.customId === 'reject-gang-disband') {
                await handleGangDisband(interaction);
            }
        }
    }
};

export default event;