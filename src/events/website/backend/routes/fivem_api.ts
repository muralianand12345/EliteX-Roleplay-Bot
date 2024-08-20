import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { client } from '../../../../bot';
import { Guild, GuildMember, Role } from 'discord.js';

const router = Router();

interface JobRole {
    head: string;
    role: string;
}

router.post('/job/roles', authenticate, async (req, res) => {
    const { userId, targetId, action } = req.body;

    try {

        if (!client.config.fivem.enalbed) return res.status(400).json({ error: 'FiveM integration is disabled' });

        const guild = client.guilds.cache.get(client.config.fivem.discord.guildId) as Guild;
        if (!guild) {
            return res.status(500).json({ error: 'Failed to find Discord guild' });
        }

        const user = guild.members.cache.get(userId) as GuildMember;
        const target = guild.members.cache.get(targetId) as GuildMember;
        if (!user || !target) {
            return res.status(400).json({ error: 'Failed to find Discord user' });
        }

        const jobRoles = client.config.fivem.discord.job.roles.find((r: JobRole) => user.roles.cache.has(r.head));
        if (!jobRoles) {
            return res.status(400).json({ error: 'User does not have a head role' });
        }

        const role = await guild.roles.fetch(jobRoles.role) as Role;

        if (action === 'add') {
            await target.roles.add(role);
            res.status(200).json({ message: 'Role added successfully' });
        } else if (action === 'remove') {
            await target.roles.remove(role);
            res.status(200).json({ message: 'Role removed successfully' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }

    } catch (error) {
        client.logger.error('Error performing Discord role action:', error);
        res.status(500).json({ error: 'Failed to perform Discord role action' });
    }
});

export default router;