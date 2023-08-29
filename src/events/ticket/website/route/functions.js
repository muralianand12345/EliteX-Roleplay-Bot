require("dotenv").config();

const { PermissionFlagsBits, GuildMember } = require('discord.js');

const AdminModal = require('../../../mongodb/modals/adminLogin.js');

function checkLoggedIn(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

async function checkSuperAdmin(req, res, next) {
    const client = require('../../../../bot.js');
    const user = await AdminModal.findOne({ username: req.session.username });
    if (!user) {
        return res.status(401).json({ message: 'Internal Error: User not found!' });
    }
    const userId = user.discordId;
    const guildId = client.config.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);
    const member = await guild.members.fetch(userId);

    if (!(member instanceof GuildMember)) {
        return res.status(401).json({ message: 'User is not a member of the Iconic Server' });
    }
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return res.status(403).json({ message: 'User does not have discord administrator permissions' });
    }

    next();
}

async function fetchMessage(channel, messageId) {
    try {
        let message = await channel.messages.fetch(messageId);

        if (!message) {
            const messageFetcher = channel.messages.fetch({ after: messageId, limit: 50 });

            let messages = await messageFetcher;
            while (messages.size > 0) {
                message = messages.find(msg => msg.id === messageId);
                if (message) {
                    break;
                }
                messages = await messageFetcher;
            }
        }
        return message;
    } catch (error) {
        return null;
    }
}

function authenticateAPIKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.WEBKEY) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

module.exports = { checkLoggedIn, fetchMessage, authenticateAPIKey, checkSuperAdmin }