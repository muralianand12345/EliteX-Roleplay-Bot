import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';

import ticketGuildModal from '../../events/database/schema/ticketGuild';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
    cooldown: 10000,
    owner: false,
    userPerms: [],
    botPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add users to the ticket.')
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Member to add to ticket')
                .setRequired(true)),
    async execute(interaction, client) {

        if (!interaction.guild) return interaction.reply({ content: 'This command can only be executed in a guild!' });
        const chan = interaction.channel as TextChannel;
        if (!chan) return interaction.reply({ content: 'Error Occured, try again.' });
        if (!chan.name.includes('ticket')) return interaction.reply({ content: 'This command can only be exectued in a ticket channel.' });

        await interaction.deferReply({ ephemeral: true });

        const ticketGuildData = await ticketGuildModal.findOne({ guildId: interaction.guild.id });
        if (!ticketGuildData) return await interaction.editReply({ content: "Ticket system isn't active in this guild." });

        const supportStaffRoleId = ticketGuildData.ticketSupportId;
        if (!supportStaffRoleId) return await interaction.editReply({ content: 'Support staff role not found!' });

        const target = interaction.options.getUser('target');
        if (!target) return await interaction.editReply({ content: 'No target selected or not available.' });

        chan.edit({
            permissionOverwrites: [
                {
                    id: target.id,
                    allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                }
            ]
        }).then(async (c) => {
            let embed = new EmbedBuilder()
                .setAuthor({ name: client.user?.username || "Iconic RP", iconURL: client.user?.displayAvatarURL() })
                .setDescription(`<@${target.id} has been added to the ticket!`);

            await c.send({ embeds: [embed] });
        });

        await interaction.editReply({ content: `Added <@${target.id}> to the ticket!` });
    }
};

export default command;