const {
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs').promises;

const discordTranscripts = require('discord-html-transcripts');

//Create --------------------------------
async function createTicketChan(client, interaction, parentCat, ticketCount, ticketSupport) {
    channel = await interaction.guild.channels.create({
        name: `ticket-${ticketCount}-${interaction.user.username}`,
        parent: parentCat,
        topic: `${ticketCount}`,
        permissionOverwrites: [
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.MentionEveryone]
            },
            {
                id: ticketSupport,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
            },
        ],
        type: ChannelType.GuildText,
    });

    return channel;
}

//const logChanID = "1109438179603402762";
async function checkTicketCategory(client, interaction, category) {
    const parentCategory = interaction.guild.channels.cache.get(category);
    if (parentCategory.children.cache.size >= 50) {
        /*let chan = client.channels.cache.get(logChanID);
        let embed = new EmbedBuilder()
            .setAuthor({ name: 'Ticket Category Limit' })
            .addFields(
                { name: 'Username', value: `${interaction.user.username}` },
                { name: 'Category', value: `${parentCategory.name}` }
            );
        chan.send({ embeds: [embed] });*/
        return true;
    } else {
        return false;
    }
}

//Close --------------------------------
async function closeTicketChan(client, interaction, parentCat, ticketSupport, userID) {
    const user = await interaction.guild.members.fetch(userID).catch(() => null);

    if (user) {
        channel = await interaction.channel.edit({
            name: `ticket-closed`,
            parent: parentCat,
            permissionOverwrites: [
                {
                    id: userID,
                    deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ticketSupport,
                    allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
            ],
        });
        return channel;
    } else {
        channel = await interaction.channel.edit({
            name: `ticket-closed`,
            parent: parentCat,
            permissionOverwrites: [
                {
                    id: ticketSupport,
                    allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
            ],
        });
        return channel;
    }
}

//Delete --------------------------------

async function deleteTicketLog(client, interaction, ticketLogDir, chan, type) {

    let htmlCode;

    switch (type) {
        case 'image-save':
            htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string',
                filename: `transcript-${interaction.channel.id}.html`,
                saveImages: true,
                poweredBy: false
            });
            break;
        default:
            htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string',
                filename: `transcript-${interaction.channel.id}.html`,
                saveImages: false,
                poweredBy: false
            });
            break;
    }

    await fs.mkdir(ticketLogDir, { recursive: true });
    await fs.writeFile(`${ticketLogDir}/transcript-${interaction.channel.id}.html`, htmlCode);

}

//Reopen --------------------------------

async function reopenTicketChan(client, interaction, ticketUser, ticketGuild) {
    var ticketNumber = /^\d+$/.test(interaction.channel.topic) ? parseInt(interaction.channel.topic) : 0;
    var userInfo = client.users.cache.get(ticketUser.userID);
    channel = await interaction.channel.edit({
        name: `ticket-reopen-${ticketNumber}-${userInfo.username}`,
        permissionOverwrites: [
            {
                id: ticketUser.userID,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.MentionEveryone]
            },
            {
                id: ticketGuild.ticketSupportID,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
            },
        ],
    });
    return channel;
}

//Export --------------------------------

module.exports = {
    createTicketChan, checkTicketCategory, closeTicketChan,
    deleteTicketLog, reopenTicketChan
};