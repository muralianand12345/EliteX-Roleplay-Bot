import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { client } from '../../../../bot';
import { EmbedBuilder, Guild, GuildMember, Role, WebhookClient } from 'discord.js';
import FivemSurveySchema from '../../../database/schema/fivemSurvey';
import { JobRole, IFivemSurveyData } from '../../../../types';

const router = Router();

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

router.post('/role/area/check', authenticate, async (req, res) => {
    const { userId, roleId } = req.body;

    try {

        if (!client.config.fivem.enabled) return res.status(400).json({ error: 'FiveM integration is disabled' });

        const guild = client.guilds.cache.get(client.config.fivem.discord.guildId) as Guild;
        if (!guild) {
            return res.status(500).json({ error: 'Failed to find Discord guild' });
        }

        const user = guild.members.cache.get(userId) as GuildMember;
        if (!user) {
            return res.status(400).json({ error: 'Failed to find Discord user' });
        }

        const role = await guild.roles.fetch(roleId) as Role;
        if (!role) {
            return res.status(400).json({ error: 'Failed to find Discord role' });
        }

        if (!user.roles.cache.has(role.id)) {
            return res.status(400).json({ error: 'User does not have the role' });
        }

        res.status(200).json({ message: 'User has the role' });

        if (client.config.fivem.log.enabled) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: client.user?.username || "", iconURL: client.user?.displayAvatarURL() })
                .setColor('Green')
                .setDescription(`User: ${user.user.tag}\nRole: ${role.name}\nAction: Check`);

            const webhook = new WebhookClient({ url: client.config.fivem.log.webhook });
            await webhook.send({
                username: client.user?.username,
                avatarURL: client.user?.displayAvatarURL(),
                embeds: [embed]
            });
        }

    } catch (error) {
        client.logger.error('Error checking Discord role area:', error);
        res.status(500).json({ error: 'Failed to check Discord role area' });
    }
});

router.post('/survey/submit', authenticate, async (req, res) => {
    const { userId, surveyData } = req.body;

    try {
        if (!client.config.fivem.enabled) return res.status(400).json({ error: 'FiveM integration is disabled' });
        const guild = client.guilds.cache.get(client.config.fivem.discord.guildId) as Guild;
        if (!guild) {
            return res.status(500).json({ error: 'Failed to find Discord guild' });
        }

        if (!surveyData.citizenId || !surveyData.IgName || !surveyData.phoneNumber || !surveyData.cpu || !surveyData.gpu || !surveyData.ram) {
            return res.status(400).json({ error: 'Missing survey data' });
        }

        let fivemSurveyDB = await FivemSurveySchema.findOne({ userId });
        if (!fivemSurveyDB) {
            fivemSurveyDB = new FivemSurveySchema({ userId, surveyData: [surveyData] });
        } else {
            const existingEntryIndex = fivemSurveyDB.surveyData.findIndex(
                (entry: IFivemSurveyData) => entry.citizenId === surveyData.citizenId
            );

            if (existingEntryIndex !== -1) {
                fivemSurveyDB.surveyData[existingEntryIndex] = surveyData;
            } else {
                fivemSurveyDB.surveyData.push(surveyData);
            }
        }

        await fivemSurveyDB.save();
        res.status(200).json({ message: 'Survey data submitted successfully' });

    } catch (error) {
        client.logger.error('Error submitting FiveM survey:', error);
        res.status(500).json({ error: 'Failed to submit FiveM survey' });
    }
});

export default router;