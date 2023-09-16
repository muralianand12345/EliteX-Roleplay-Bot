const express = require('express');
const router = express.Router();
const { ChannelType, WebhookClient, EmbedBuilder } = require('discord.js');
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const { checkLoggedIn, fetchMessage } = require('../functions.js');
const AdminModal = require('../../../../mongodb/modals/adminLogin.js');
const TicketModel = require('../../../../mongodb/modals/ticketlog.js');
const roleModel = require('../../../../mongodb/modals/roleremove.js');
const client = require('../../../../../bot.js');

//---------------------------------------------------------

const guildId = client.config.GUILD_ID;
const roleEdit = client.website.ROLES.roles;
const allowedRoleIds = client.website.ROLES.allowed_getrole;

const Web = process.env.WEBSITEMESSWEB;
const WebRole = process.env.WEBSITEROLE;

const webhookClient = new WebhookClient({ url: Web });
const webhookClientRole = new WebhookClient({ url: WebRole });

//---------------------------------------------------------

router.get('/getprofile', checkLoggedIn, async (req, res) => {
    try {
        const user = await AdminModal.findOne({ username: req.session.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const profileInfo = {
            discordUsername: user.discordUsername,
            discordId: user.discordId,
            discordAvatar: user.discordAvatar,
        };
        return res.status(200).json(profileInfo);
    } catch (error) {
        console.error('Error fetching profile information:', error);
        return res.status(500).json({ message: 'An error occurred while fetching profile information' });
    }
});

router.get('/getchannels', checkLoggedIn, async (req, res) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.channels.fetch();
        const channels = [];
        guild.channels.cache.forEach(channel => {
            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement || channel.type === ChannelType.GuildVoice) {
                channels.push({ id: channel.id, name: channel.name });
            }
        });
        res.json(channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ message: 'An error occurred while fetching channels' });
    }
});

router.post('/sendmessage', checkLoggedIn, async (req, res) => {
    const { channelId, message } = req.body;
    const userName = req.session.username;
    const userId = req.session.discordId;
    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFields(
                { name: `User`, value: `${userName}` },
                { name: `User Tag`, value: `<@${userId}>` },
            );

        if (message.length <= 1000) {
            await channel.send(message);
            embed.addFields({ name: `Message`, value: `\`\`\`${message}\`\`\`` });
        } else {
            const chunks = message.match(/[\s\S]{1,1000}/g);
            let accumulatedContent = '';
            for (const chunk of chunks) {
                await channel.send(chunk);
                accumulatedContent += chunk;
            }
            const fieldChunks = accumulatedContent.match(/[\s\S]{1,1000}/g);
            fieldChunks.forEach((fieldChunk, index) => {
                const fieldName = index === 0 ? `Message (Part ${index + 1})` : `... (Part ${index + 1})`;
                embed.addFields({ name: fieldName, value: `\`\`\`${fieldChunk}\`\`\`` });
            });
        }
        await webhookClient.send({
            username: 'Message Sender',
            avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1138481217306644480/com.png",
            embeds: [embed],
        });
        return res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ message: 'An error occurred while sending the message' });
    }
});

router.get('/getfilelist', checkLoggedIn, async (req, res) => {
    const searchText = req.query.search || '';
    try {
        const tickets = await TicketModel.find({
            $or: [
                { ticketNumber: { $regex: searchText, $options: 'i' } },
                { ticketId: { $regex: searchText, $options: 'i' } },
                { userID: { $regex: searchText, $options: 'i' } }
            ]
        });

        const ticketList = tickets.map(ticket => ({
            ticketNumber: ticket.ticketNumber,
            ticketId: ticket.ticketId,
            transcriptLink: ticket.transcriptLink,
            userID: ticket.userID,
            ticketlog: ticket.ticketlog // Include the ticketlog array
        }));

        res.json(ticketList);
    } catch (error) {
        console.error('Error fetching ticket data:', error);
        res.status(500).json({ error: 'An error occurred while fetching ticket data.' });
    }
});

router.post('/editmessage', checkLoggedIn, async (req, res) => {
    const { channelId, messageId, editedMessage } = req.body;
    const userName = req.session.username;
    const userId = req.session.discordId;

    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        const message = await fetchMessage(channel, messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }


        if (message.author.id !== client.user.id) {
            return res.status(403).json({ message: 'Unable to edit, Can only edit message sent by the Bot!' });
        }

        await message.edit(editedMessage);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setFields(
                { name: `User`, value: `${userName}` },
                { name: `User Tag`, value: `<@${userId}>` },
                { name: `Edited Message`, value: `\`\`\`${editedMessage}\`\`\`` }
            );

        await webhookClient.send({
            username: 'Message Editor',
            avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1138481217306644480/com.png",
            embeds: [embed],
        });

        return res.status(200).json({ message: 'Message edited successfully' });
    } catch (error) {
        console.error('Error editing message:', error);
        return res.status(500).json({ message: 'An error occurred while editing the message' });
    }
});

router.get('/getmessage/:messageId', checkLoggedIn, async (req, res) => {
    const { messageId } = req.params;
    const channelId = req.query.channelId;

    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({ messageContent: 'Channel not found' });
        }

        const message = await fetchMessage(channel, messageId);
        if (!message) {
            return res.status(404).json({ messageContent: 'Message not found' });
        }

        return res.status(200).json({ messageContent: message.content });
    } catch (error) {
        console.error('Error fetching message content:', error);
        return res.status(500).json({ messageContent: 'An error occurred while fetching message content' });
    }
});

router.post('/getdiscorddata', checkLoggedIn, async (req, res) => {
    const { userId, roleId, action } = req.body;
    const userName = req.session.username;
    const discorduserId = req.session.discordId;

    const embed = new EmbedBuilder()
        .setFields(
            { name: `User`, value: `${userName}` },
            { name: `User Tag`, value: `<@${discorduserId}>` }
        );
    try {
        const guild = await client.guilds.fetch(guildId);

        var memberId;

        const userIdRegex = /^[0-9]+$/;
        if (userId.match(userIdRegex)) {
            memberId = userId;
        } else {
            const userByUsername = guild.members.cache.find((member) => member.user.username === userId);
            if (!userByUsername) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            memberId = userByUsername.id;
        }

        const member = await guild.members.fetch(memberId);
        const role = guild.roles.cache.get(roleId);

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const roleExistsInJson = roleEdit.some(jsonRole => jsonRole.id === roleId);
        let responseMessage = '';

        if (!roleExistsInJson) {
            responseMessage = `Role with ID ${roleId} not found in the JSON structure`;
        } else if (action === 'add') {
            if (role) {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    embed.addFields(
                        { name: 'To', value: `<@${memberId}>` },
                        { name: 'Role Added', value: `${role.name}` }
                    )
                        .setColor('Green');
                    responseMessage = `Added role ${role.name} to ${member.user.tag}`;
                } else {
                    responseMessage = `${member.user.tag} already has the role ${role.name}`;
                }
            } else {
                responseMessage = `Role with ID ${roleId} not found`;
            }
        } else if (action === 'remove') {
            if (role) {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    embed.addFields(
                        { name: 'To', value: `<@${memberId}>` },
                        { name: 'Role Removed', value: `${role.name}` }
                    )
                        .setColor('Red');
                    responseMessage = `Removed role ${role.name} from ${member.user.tag}`;
                } else {
                    responseMessage = `${member.user.tag} doesn't have the role ${role.name}`;
                }

                if (role.id === client.ooc.LIVE) {
                    const expirationDate = new Date(Date.now() + 10 * 60 * 1000);
                    const newRoleData = new roleModel({
                        userId: member.id,
                        roleId: role.id,
                        expirationDate: expirationDate,
                        guildId: guild.id
                    });
                    await newRoleData.save();
                }

            } else {
                responseMessage = `Role with ID ${roleId} not found`;
            }
        } else {
            responseMessage = 'Invalid action';
        }

        await webhookClientRole.send({
            username: 'Role Manager',
            avatarURL: "https://cdn.discordapp.com/attachments/1139959714613047379/1139961658085744693/pc3NbRkZGRkZGRkZGRkZGRkZGRkZGRsYp8hWngQnR0xhZQAAAABJRU5ErkJggg.png",
            embeds: [embed],
        });
        return res.status(200).json({ success: true, message: responseMessage });
    } catch (error) {
        console.error('Error processing Discord data:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while processing Discord data' });
    }
});

router.get('/getroles', checkLoggedIn, async (req, res) => {
    try {
        res.json({ roles: roleEdit });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'An error occurred while fetching roles' });
    }
});

router.get('/filecount', (req, res) => {
    const ticketLogDir = path.join(__dirname, '../../ticket-logs');
    fs.readdir(ticketLogDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            res.status(500).json({ error: 'Failed to read directory.' });
        } else {
            const fileCount = files.length;
            res.json({ fileCount });
        }
    });
});

router.post('/sendembed', checkLoggedIn, (req, res) => {
    const embedData = req.body;

    if (!embedData.webhook) return res.status(400).json({ error: 'Invalid Webhook URL' });

    const webhookClientEmbed = new WebhookClient({ url: embedData.webhook });

    const embed = new EmbedBuilder()
        .setColor(embedData.color);

    if (embedData.title) {
        embed.setTitle(embedData.title);
    }
    if (embedData.url) {
        embed.setURL(embedData.url);
    }
    if (embedData.author && embedData.author.length > 0) {
        embed.setAuthor({ name: embedData.author[0].name, iconURL: embedData.author[0].icon_url || null, url: embedData.author[0].url || null });
    }
    if (embedData.description) {
        embed.setDescription(embedData.description);
    }
    if (embedData.thumbnail) {
        embed.setThumbnail(embedData.thumbnail);
    }
    if (embedData.image) {
        embed.setImage(embedData.image);
    }
    if (embedData.timestamp) {
        embed.setTimestamp();
    }
    if (embedData.footer && embedData.footer.length > 0) {
        embed.setFooter({ text: embedData.footer[0].text, iconURL: embedData.footer[0].icon_url || null });
    }
    embedData.fields.forEach(field => {
        embed.addFields({ name: field.name, value: field.value });
    });

    webhookClientEmbed.send({
        username: 'Iconic Roleplay',
        avatarURL: "https://cdn.discordapp.com/avatars/942080467241410630/7f5814e2184723cac12d87ec7fe433f3.png",
        embeds: [embed.toJSON()]
    })
        .then(() => {
            res.status(200).json({ message: 'Embed sent successfully' });
        })
        .catch(error => {
            console.error('Error sending embed:', error);
            res.status(500).json({ error: 'An error occurred while sending the embed' });
        });
});

router.post('/getmembersbyrole', checkLoggedIn, async (req, res) => {
    const { roleId } = req.body;

    if (!allowedRoleIds.includes(roleId)) {
        return res.status(403).json([{ id: '', username: 'Restricted!' }]);
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        const role = guild.roles.cache.get(roleId);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        const membersWithRole = role.members.map(member => ({
            id: member.user.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
        }));

        return res.status(200).json(membersWithRole);
    } catch (error) {
        console.error('Error fetching members by role:', error);
        return res.status(500).json({ message: 'An error occurred while fetching members by role' });
    }
});

module.exports = router;