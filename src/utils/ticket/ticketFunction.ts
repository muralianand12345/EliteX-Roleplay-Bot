import { CategoryChannel, ChannelType, Client, Interaction, PermissionFlagsBits, TextChannel } from "discord.js";
import discordTranscripts from "discord-html-transcripts";
import fs from "fs";
const fsPromises = fs.promises;

import { ITicketUser, ITicketGuild } from "../../types";

const createTicketChan = async (client: Client, interaction: Interaction, parentCat: string | null, ticketCount: number, ticketSupport: string) => {
    const channel = await interaction.guild?.channels.create({
        name: `ticket-${ticketCount}-${interaction.user.username}`,
        parent: parentCat || null,
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
                id: interaction.guild?.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
            },
        ],
        type: ChannelType.GuildText,
    });

    return channel;
}

const checkTicketCategory = async (client: Client, interaction: Interaction, category: string) => {
    const parentCategory = interaction.guild?.channels.cache.get(category) as CategoryChannel;
    if (parentCategory?.children.cache.size >= 50) {
        return true;
    } else {
        return false;
    }
}

const closeTicketChan = async (client: Client, interaction: Interaction, parentCat: string, ticketSupport: string, userID: string) => {
    const user = await interaction.guild?.members.fetch(userID).catch(() => null);
    if (interaction.channel?.type !== ChannelType.GuildText) return;
    if (!interaction.guild) return;

    const permissions = [
        {
            id: ticketSupport,
            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
        },
        {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
        },
    ];

    if (user) {
        permissions.unshift({
            id: userID,
            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
        });
    }

    const channel = await interaction.channel?.edit({
        name: `ticket-closed`,
        parent: parentCat,
        permissionOverwrites: permissions,
    });

    return channel;
};

const deleteTicketLog = async (client: Client, interaction: Interaction, ticketLogDir: string, chan: TextChannel, type: string) => {
    let htmlCode;

    switch (type) {
        case 'image-save':
            htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string' as any,
                filename: `transcript-${interaction.channel?.id}.html`,
                saveImages: true,
                poweredBy: false
            });
            break;
        case 'no-image-save':
            htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string' as any,
                filename: `transcript-${interaction.channel?.id}.html`,
                saveImages: false,
                poweredBy: false
            });
            break;
        default:
            htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string' as any,
                filename: `transcript-${interaction.channel?.id}.html`,
                saveImages: false,
                poweredBy: false
            });
            break;
    }

    await fsPromises.mkdir(ticketLogDir.toString(), { recursive: true });
    await fsPromises.writeFile(`${ticketLogDir}/transcript-${interaction.channel?.id}.html`, htmlCode as string);
}

const reopenTicketChan = async (client: Client, interaction: Interaction, ticketUser: ITicketUser, ticketGuild: ITicketGuild) => {
    if (!interaction.guild) return;
    if (!interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) return;
    const ticketNumber = /^\d+$/.test(interaction.channel.topic || "") ? parseInt(interaction.channel.topic || "") : 0;
    const userInfo = client.users.cache.get(ticketUser.userId);

    const channel = await interaction.channel.edit({
        name: `ticket-reopen-${ticketNumber}-${userInfo?.username}`,
        permissionOverwrites: [
            {
                id: ticketUser.userId,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.MentionEveryone]
            },
            {
                id: ticketGuild.ticketSupportId,
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

export { createTicketChan, checkTicketCategory, closeTicketChan, deleteTicketLog, reopenTicketChan };