import { CategoryChannel, ChannelType, Client, Interaction, PermissionFlagsBits, TextChannel, Collection, Message } from "discord.js";
import { writeTicketLog } from "./ticketDataLogger";
import { ExportReturnType, createTranscript } from "discord-html-transcripts";
import fs from "fs";
import path from "path";
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
    let messages = new Collection<string, Message>();
    let lastId: string | undefined;

    while (true) {
        const options: { limit: number; before?: string } = { limit: 100 };
        if (lastId) options.before = lastId;

        const fetchedMessages = await chan.messages.fetch(options);
        if (fetchedMessages.size === 0) break;

        messages = messages.concat(fetchedMessages);
        lastId = fetchedMessages.last()?.id;
        if (fetchedMessages.size < 100) break;
    }

    if (messages.size === 0) {
        client.logger.info('Ticket | No messages found in channel.');
        return;
    }

    await writeTicketLog(
        interaction.guild?.id ?? '',
        (interaction.member?.user as any)?.id ?? '',
        interaction.channel?.id ?? '',
        Array.from(messages.values())
    );

    const transcriptOptions = {
        limit: -1,
        returnType: 'string' as ExportReturnType,
        filename: `transcript-${interaction.channel?.id}.html`,
        saveImages: type === 'image-save',
        poweredBy: false
    };

    const htmlCode = await createTranscript(chan, transcriptOptions);
    await fsPromises.mkdir(ticketLogDir, { recursive: true });
    const htmlFilePath = path.join(ticketLogDir, `transcript-${interaction.channel?.id}.html`);
    const htmlContent = typeof htmlCode === 'string' ? htmlCode : htmlCode.toString();
    await fsPromises.writeFile(htmlFilePath, htmlContent);
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