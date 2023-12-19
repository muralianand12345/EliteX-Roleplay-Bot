const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

//Ticket Button ------------------------------------------

const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('close-ticket')
            .setLabel('Close Ticket')
            .setEmoji('899745362137477181')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('transcript-ticket')
            .setLabel('Transcript')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('claim-ticket')
            .setLabel('Claim')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary),
    );

const rowDisClose = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('close-ticket')
            .setLabel('Close Ticket')
            .setEmoji('899745362137477181')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('transcript-ticket')
            .setLabel('Transcript')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('claim-ticket')
            .setLabel('Claim')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary),
    );

const rowDisAll = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('close-ticket')
            .setLabel('Close Ticket')
            .setEmoji('899745362137477181')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('transcript-ticket')
            .setLabel('Transcript')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('claim-ticket')
            .setLabel('Claim')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
    );

const rowClaimDis = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('close-ticket')
            .setLabel('Close Ticket')
            .setEmoji('899745362137477181')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('transcript-ticket')
            .setLabel('Transcript')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('claim-ticket')
            .setLabel('Claim')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
    );

const rowTicketClose = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('delete-ticket')
            .setLabel('Delete Ticket')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('delete-ticket-reason')
            .setLabel('Delete with Reason')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('reopen-ticket')
            .setLabel('Reopen Ticket')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Success)
    );

const rowTicketCloseDisAll = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('delete-ticket')
            .setLabel('Delete Ticket')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('delete-ticket-reason')
            .setLabel('Delete with Reason')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('reopen-ticket')
            .setLabel('Reopen Ticket')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
    );

//Ticket Function ------------------------------------------

async function createTicketEmbed(client, interaction, channel) {
    const embed = new EmbedBuilder()
        .setColor('#206694')
        .setAuthor({ name: 'Ticket', iconURL: client.user.avatarURL() })
        .setDescription(`<@!${interaction.user.id}> Created a ticket`)
        .setFooter({ text: client.user.username, iconURL: client.user.avatarURL() })
        .setTimestamp();

    opened = await channel.send({
        content: `**Your Ticket Has Been Created!**`,
        embeds: [embed],
        components: [row]
    });

    opened.pin().then(() => {
        opened.channel.bulkDelete(1);
    });

    return opened;
}

// OOC ---------------------------------------------------

async function showTicketModal(client, interaction) {

    const oocModal = new ModalBuilder()
        .setCustomId('modal-ticket')
        .setTitle('Ticket Details');

    const oocDate = new TextInputBuilder()
        .setCustomId('date-modal-ticket')
        .setLabel('Date and Time of the Scenario:')
        .setPlaceholder('Approximate Time is also acceptable')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const oocAgainst = new TextInputBuilder()
        .setCustomId('against-modal-ticket')
        .setLabel('Ticket Raised Against/For:')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
    const oocDetails = new TextInputBuilder()
        .setCustomId('details-modal-ticket')
        .setLabel('Ticket raised because of:')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(true);
    const oocProof = new TextInputBuilder()
        .setCustomId('proof-modal-ticket')
        .setLabel('Proof')
        .setPlaceholder('Yes/No')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(oocDate);
    const secondActionRow = new ActionRowBuilder().addComponents(oocAgainst);
    const thirdActionRow = new ActionRowBuilder().addComponents(oocDetails);
    const fourthActionRow = new ActionRowBuilder().addComponents(oocProof);

    oocModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
    await interaction.showModal(oocModal);
}

async function ticketModalEmbed(client, interaction, ticketChan) {
    const Date = interaction.fields.getTextInputValue('date-modal-ticket');
    const Against = interaction.fields.getTextInputValue('against-modal-ticket') || "Unknown";
    const Proof = interaction.fields.getTextInputValue('proof-modal-ticket') || "No Proof";
    const Details = interaction.fields.getTextInputValue('details-modal-ticket');

    const embed = new EmbedBuilder()
        .setDescription(`<@${interaction.user.id}> **| OOC Ticket Details**`)
        .addFields(
            { name: '**Date and Time:**', value: `\`\`\`${Date}\`\`\`` },
            { name: '**OOC Against:**', value: `\`\`\`${Against}\`\`\`` },
            { name: '**Ticket Raised Because Of:**', value: `\`\`\`${Details}\`\`\`` },
            { name: '**Proof/Evidence:**', value: `\`\`\`${Proof}\`\`\`` }
        );
    await ticketChan.send({ embeds: [embed] });
}

//Claim --------------------------------------------------

async function claimTicketEmbed(client, interaction) {
    const embed = new EmbedBuilder()
        .setColor('Green')
        .setAuthor({ name: 'Claimed Ticket' })
        .setDescription(`Your ticket will be handled by <@${interaction.user.id}>`);
    await interaction.reply({ embeds: [embed] }).then(async (msg) => {

        const content = `**Handled By** <@${interaction.user.id}>`;
        await interaction.message.edit({ content: content, components: [rowClaimDis] });
    });
}

//Close Ticket ----------------------------------------------

async function closeTicketEmbed(client, interaction) {

    var embed = new EmbedBuilder()
        .setColor('#206694')
        .setAuthor({ name: 'Ticket', iconURL: client.user.avatarURL() })
        .setFooter({ text: client.user.username, iconURL: client.user.avatarURL() })
        .setTimestamp();

    const channel = interaction.channel;
    if (channel.parent) {
        const categoryName = channel.parent.name;
        embed.setDescription(`\`\`\`Delete After Verifying | ${categoryName}\`\`\``)
    } else {
        embed.setDescription(`\`\`\`Delete After Verifying\`\`\``)
    }

    await interaction.channel.send({
        embeds: [embed],
        components: [rowTicketClose]
    });
}

async function closeTicketEditInt(client, interaction) {
    await interaction.message.edit({ components: [rowDisAll] });
}

//Delete Ticket ----------------------------------------------

async function deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, TicketReason) {
    var embed = new EmbedBuilder()
        .setAuthor({ name: 'Logs Ticket', iconURL: client.user.avatarURL() })
        .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${ticketUser.userID}> and deleted by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${serverAdd}/transcript-${interaction.channel.id}.html)`)
        .setColor('#206694')
        .setTimestamp();

    if (TicketReason) {
        embed.addFields({ name: 'Reason', value: `\`\`\`${TicketReason}\`\`\`` });
    }

    client.users.cache.get(ticketUser.userID).send({
        embeds: [embed]
    }).catch(error => {
        if (error.code == 50007) {
            embed.addFields({ name: 'Status', value: `**Unable to DM User**` });
            return client.channels.cache.get(ticketGuild.ticketLogID).send({
                embeds: [embed]
            });
        }
    });
}

async function deleteTicketReasonModal(client, interaction) {
    const reasonModal = new ModalBuilder()
        .setCustomId('ticket-reason-modal')
        .setTitle('Ticket Reason');

    const Reason = new TextInputBuilder()
        .setCustomId('ticket-reason-modal-text')
        .setLabel('Ticket Close Text')
        .setMaxLength(1000)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(Reason);
    reasonModal.addComponents(firstActionRow);
    await interaction.showModal(reasonModal);
}

async function deleteTicketSpam(client, interaction) {
    const replyEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setDescription("Interaction not registered! (Button Spam Dedected!)");
    await interaction.editReply({ embeds: [replyEmbed], ephemeral: true });
}

//Bug Ticket ----------------------------------------------

async function ticketBugEmbed(client, message, ticketDoc) {
    const chan = message.channel;
    const embed = new EmbedBuilder()
        .setColor('#206694')
        .setAuthor({ name: 'Ticket', iconURL: client.user.avatarURL() })
        .setDescription(`**Created a ticket**`)
        .setFooter({ text: client.user.username, iconURL: client.user.avatarURL() })
        .setTimestamp();

    if (!ticketDoc) {
        await chan.send({
            content: 'No Ticket Found in Database! / Manual delete needed',
            embeds: [embed],
            components: [rowDisClose]
        });
    } else {
        await chan.send({ embeds: [embed], components: [row] });
    }
    await message.delete();
}

//Reopen Ticket ----------------------------------------------

async function reopenEmbedEdit(interaction, message) {
    await message.edit({ components: [rowClaimDis] });
    await interaction.message.edit({ components: [rowTicketCloseDisAll] });
}

//Export ------------------------------------------------------

module.exports = {
    createTicketEmbed, showTicketModal, ticketModalEmbed,
    claimTicketEmbed, closeTicketEmbed, closeTicketEditInt, deleteTicketEmbedandClient, deleteTicketReasonModal,
    deleteTicketSpam, ticketBugEmbed, reopenEmbedEdit
};