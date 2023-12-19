const {
    ComponentType,
    Events,
} = require('discord.js');
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require("discord.js");

const ticketGuildModel = require('../../database/modals/ticketGuild.js');
const ticketUserModel = require('../../database/modals/ticketUser.js');

const { createTicketChan, checkTicketCategory } = require('./functions/ticketFunction.js');
const { createTicketEmbed, showTicketModal, ticketModalEmbed } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId === "open-ticket") {

            await interaction.deferReply({ ephemeral: true });

            //Database ----------------------------------------

            var ticketGuild = await ticketGuildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => client.logger.error(err));

            var ticketUser = await ticketUserModel.findOne({
                userID: interaction.user.id
            }).catch(err => client.logger.error(err));

            if (!ticketGuild || !ticketGuild.ticketStatus) {
                return await interaction.editReply({ content: 'Ticket system is not active!', ephemeral: true });
            }

            if (ticketUser) {
                const activeTickets = ticketUser.ticketlog.filter(ticket => ticket.activeStatus);
                if (activeTickets.length >= ticketGuild.ticketMaxCount) {
                    return await interaction.editReply({ content: 'You have reached the maximum amount of tickets!', ephemeral: true });
                }
            } else {
                ticketUser = new ticketUserModel({
                    userID: interaction.user.id,
                    ticketlog: [],
                });
                await ticketUser.save();
            }

            const ticketOption = ticketGuild.category.map(category => ({
                label: category.label,
                value: category.value,
                emoji: category.emoji,
            }));

            const chooseEmbed = new EmbedBuilder()
                .setColor('#206694')
                .setAuthor({ name: 'Ticket', iconURL: client.user.avatarURL() })
                .setDescription('Select the category of your ticket')
                .setFooter({ text: client.user.username, iconURL: client.user.avatarURL() })
                .setTimestamp();

            var chooseRow = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('category-ticket')
                        .setPlaceholder('Select the ticket category')
                        .addOptions(ticketOption),
                );

            msg = await interaction.editReply({
                embeds: [chooseEmbed],
                components: [chooseRow]
            });

            const collector = await msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 30000
            });

            collector.on('collect', async (i) => {
                if (i.user.id === interaction.user.id) {

                    if (i.values[0]) {
                        if (await checkTicketCategory(client, interaction, i.values[0])) {
                            return await i.reply({
                                content: 'Sorry, the ticket category is full! Try again later.',
                                ephemeral: true,
                            });
                        }

                        await showTicketModal(client, i);

                        ticketGuild.ticketCount += 1;
                        await ticketGuild.save();

                        await createTicketChan(client, interaction, i.values[0], ticketGuild.ticketCount, ticketGuild.ticketSupportID)
                            .then(async (c) => {
                                await interaction.editReply({
                                    content: `Ticket Created <#${c.id}>`,
                                    embeds: [],
                                    components: []
                                });
                                opened = await createTicketEmbed(client, interaction, c);
                                let ticketData = {
                                    guildID: interaction.guild.id,
                                    activeStatus: true,
                                    ticketNumber: ticketGuild.ticketCount,
                                    ticketId: c.id,
                                    ticketPannelId: opened.id,
                                };
                                ticketUser.ticketlog.push(ticketData);
                                ticketUser.recentTicketID = c.id;
                                await ticketUser.save();
                            });

                    }
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size < 1) {
                    await interaction.editReply({
                        content: 'Ticket creation has timed out!',
                        embeds: [],
                        components: [],
                        ephemeral: true
                    });
                }
            });
        }

        if (interaction.customId == "modal-ticket") {

            var ticketUser = await ticketUserModel.findOne({
                userID: interaction.user.id
            }).catch(err => client.logger.error(err));

            const ticketChan = client.channels.cache.get(ticketUser.recentTicketID);
            await interaction.deferReply({ ephemeral: true });

            ticketModalEmbed(client, interaction, ticketChan);
            await interaction.editReply({ content: "Detail Submitted!", ephemeral: true });
        }

    }
};