import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { client } from '../../../../bot';
import { EmbedBuilder, Guild, GuildMember, Role, WebhookClient } from 'discord.js';

const router = Router();

interface JobRole {
    head: string;
    role: string;
}

router.post('/job/roles', authenticate, async (req, res) => {
    const { userId, targetId, action } = req.body;

    try {

        if (!client.config.fivem.enabled) return res.status(400).json({ error: 'FiveM integration is disabled' });

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

        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user?.username || "", iconURL: client.user?.displayAvatarURL() })
            .setColor(action === 'add' ? 'Green' : 'Red')
            .setDescription(`User: ${user.user.tag}\nTarget: ${target.user.tag}\nRole: ${role.name}\nAction: ${action}`);

        if (client.config.fivem.log.enabled) {
            const webhook = new WebhookClient({ url: client.config.fivem.log.webhook });
            await webhook.send({
                username: client.user?.username,
                avatarURL: client.user?.displayAvatarURL(),
                embeds: [embed]
            });
        }

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