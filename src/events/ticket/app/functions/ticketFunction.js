const {
    ChannelType,
    PermissionFlagsBits,
} = require('discord.js');

const fs = require('fs');

const discordTranscripts = require('discord-html-transcripts');

//Create --------------------------------
async function createTicketChan(client, interaction, parentCat, ticketCount, ticketSupport) {
    channel = await interaction.guild.channels.create({
        name: `ticket-${ticketCount}-${interaction.user.username}`,
        parent: parentCat,
        topic: ticketCount,
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

async function deleteTicketLog(client, interaction, ticketLogDir, chan) {
    const htmlCode = await discordTranscripts.createTranscript(chan, {
        limit: -1,
        returnType: 'string',
        filename: `transcript-${interaction.channel.id}.html`,
        saveImages: false,
        poweredBy: false
    });

    fs.writeFile(`${ticketLogDir}/transcript-${interaction.channel.id}.html`, htmlCode, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

//Export --------------------------------
module.exports = { createTicketChan, closeTicketChan, deleteTicketLog }