const express = require('express');
const router = express.Router();
require("dotenv").config();

const { checkSuperAdmin } = require('../functions.js');
const client = require('../../../../../bot.js');

router.get('/getroles', checkSuperAdmin, (req, res) => {
    const guildId = client.config.GUILD_ID;;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
    }

    const roles = guild.roles.cache
        .filter(role => role.name !== '@everyone')
        .map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor === '#000000' ? '#ffffff' : role.hexColor,
        }));
    res.json(roles);
});

router.post('/rolebulk', checkSuperAdmin, async (req, res) => {
    const { roleId, userIds, action } = req.body;

    if (!roleId || !userIds || !action) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    const guildId = client.config.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
    }

    const role = guild.roles.cache.get(roleId);

    if (!role) {
        return res.status(404).json({ error: 'Role not found' });
    }

    const successResults = [];
    const errorResults = [];

    for (const userId of userIds) {
        try {
            const member = await guild.members.fetch(userId);
            if (action === 'add') {
                await member.roles.add(role);
                successResults.push(`Added role to user: ${userId}`);
            } else if (action === 'remove') {
                await member.roles.remove(role);
                successResults.push(`Removed role from user: ${userId}`);
            }
        } catch (error) {
            errorResults.push(`Error processing user ${userId}: ${error.message}`);
        }
    }

    const response = {
        success: successResults,
        errors: errorResults,
    };

    res.json(response);
});

module.exports = router;