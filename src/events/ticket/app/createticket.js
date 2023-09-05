const {
    ComponentType,
    Events,
} = require('discord.js');
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require("discord.js");

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");
const guildModel = require('../../../events/mongodb/modals/guild.js');
const ticketPar = require('../../../events/mongodb/modals/ticketParent.js');

const { createTicketChan } = require('./functions/ticketFunction.js');
const { createTicketEmbed, showTicketModalOOC, showTicketModalOthers, ticketModalOOCEmbed, ticketModalOthersEmbed } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const errChan = client.config.ERR_LOG.CHAN_ID;
        const errorSend = client.channels.cache.get(errChan);

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId === "open-ticket") {

            await interaction.deferReply({ ephemeral: true });

            //Database

            var ticketCheck = await ticketModel.findOne({
                guildID: interaction.guild.id,
                userID: interaction.user.id
            }).catch(err => console.log(err));

            var ticketParents = await ticketPar.findOne({
                guildID: interaction.guild.id
            }).catch(err => console.log(err));

            var IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            var guildDoc = await guildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => console.log(err));

            if (!guildDoc) {
                guildDoc = new guildModel({
                    guildID: interaction.guild.id,
                    ticketCount: 0
                });
                await guildDoc.save();
            }

            if (!ticketParents || !IdData) {
                return await interaction.editReply({ content: 'Setup is incomplete :(', ephemeral: true });
            }

            if (ticketCheck) {
                await interaction.editReply({
                    content: '**You have already created a ticket! Kindly Contact any Ticket Supporters if not!**',
                    ephemeral: true
                });

                const ticEmbed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setDescription("Unable to open a new Ticket")
                    .addFields(
                        { name: 'User', value: `<@!${interaction.user.id}>` },
                        { name: 'Reason', value: "has already opened a Ticket" }
                    );
                return errorSend.send({ embeds: [ticEmbed] });
            }

            //Ticket

            const embed = new EmbedBuilder()
                .setColor('#206694')
                .setAuthor({ name: 'Ticket', iconURL: client.config.EMBED.IMAGE })
                .setDescription('Select the category of your ticket')
                .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.user.avatarURL() })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('category')
                        .setPlaceholder('Select the ticket category')
                        .addOptions([
                            {
                                label: 'OOC',
                                value: 'Ooc',
                                emoji: '📝',
                            },
                            {
                                label: 'OTHERS',
                                value: 'Others',
                                emoji: '📙',
                            },
                        ]),
                );

            msg = await interaction.editReply({
                embeds: [embed],
                components: [row]
            });

            const collector = await msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 30000
            });

            collector.on('collect', async (i) => {
                if (i.user.id === interaction.user.id) {

                    if (i.values[0] == 'Ooc') {

                        await showTicketModalOOC(client, i);

                        guildDoc.ticketCount += 1;
                        await guildDoc.save();

                        //Create Ticket

                        await createTicketChan(client, interaction, ticketParents.oocPar, guildDoc.ticketCount, IdData.ticketSupportID)
                            .then(async (c) => {

                                await interaction.editReply({
                                    content: `Ticket Created <#${c.id}>`,
                                    embeds: [],
                                    components: []
                                });

                                await createTicketEmbed(client, interaction, i, c).then(async (opened) => {
                                    var ticketDoc = await new ticketModel({
                                        guildID: interaction.guild.id,
                                        userID: interaction.user.id,
                                        ticketID: c.id,
                                        ticketStatus: true,
                                        msgID: msg.id,
                                        msgPannelID: opened.id
                                    });
                                    await ticketDoc.save();
                                });
                            });
                    }

                    if (i.values[0] == 'Others') {

                        await showTicketModalOthers(client, i);

                        guildDoc.ticketCount += 1;
                        await guildDoc.save();

                        //Create Ticket

                        await createTicketChan(client, interaction, ticketParents.otherPar, guildDoc.ticketCount, IdData.ticketSupportID)
                            .then(async (c) => {

                                await interaction.editReply({
                                    content: `Ticket Created <#${c.id}>`,
                                    embeds: [],
                                    components: []
                                });

                                await createTicketEmbed(client, interaction, i, c).then(async (opened) => {
                                    var ticketDoc = await new ticketModel({
                                        guildID: interaction.guild.id,
                                        userID: interaction.user.id,
                                        ticketID: c.id,
                                        ticketStatus: true,
                                        msgID: msg.id,
                                        msgPannelID: opened.id
                                    });
                                    await ticketDoc.save();
                                });
                            });

                    }
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size < 1) {
                    await interaction.editReply({
                        content: `No category selected, Ticket Closed!`,
                        embeds: [],
                        components: [],
                        ephemeral: true
                    });

                    const ticEmbed2 = new EmbedBuilder()
                        .setColor('#3498DB')
                        .setAuthor({ name: `${interaction.guild.name}` })
                        .setDescription("Menu Closed")
                        .addFields(
                            { name: 'User', value: `<@!${interaction.user.id}>` },
                            { name: 'Reason', value: "No Category Selected" }
                        );
                    return errorSend.send({ embeds: [ticEmbed2] });
                }
            });
        }

        if (interaction.customId == "ticket-ooc-modal") {

            await interaction.deferReply({ ephemeral: true });

            var ticketCheck = await ticketModel.findOne({
                guildID: interaction.guild.id,
                userID: interaction.user.id
            }).catch(err => console.log(err));

            if (!ticketCheck) {
                await interaction.editReply({ content: "Internal Error | Contact Discord Developer", ephemeral: true });
            }

            const ticketChanID = ticketCheck.ticketID;
            const ticketChan = client.channels.cache.get(ticketChanID);

            ticketModalOOCEmbed(client, interaction, ticketChan);
            await interaction.editReply({ content: "Detail Submitted!", ephemeral: true });
        }

        if (interaction.customId == "ticket-others-modal") {

            await interaction.deferReply({ ephemeral: true });

            var ticketCheck = await ticketModel.findOne({
                guildID: interaction.guild.id,
                userID: interaction.user.id
            }).catch(err => console.log(err));

            if (!ticketCheck) {
                await interaction.editReply({ content: "Internal Error | Contact Discord Developer", ephemeral: true });
            }

            const ticketChanID = ticketCheck.ticketID;
            const ticketChan = client.channels.cache.get(ticketChanID);

            ticketModalOthersEmbed(client, interaction, ticketChan);
            await interaction.editReply({ content: "Detail Submitted!", ephemeral: true });
        }
    }
};