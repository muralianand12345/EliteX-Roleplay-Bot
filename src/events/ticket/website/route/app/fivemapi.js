const express = require('express');
const router = express.Router();
const { WebhookClient, EmbedBuilder } = require('discord.js');
require("dotenv").config();

const { authenticateAPIKey } = require('../functions.js');
const client = require('../../../../../bot.js');

//---------------------------------------------------------

const Web = process.env.WEBSITEFIVEMROLE;
const webhookClient = new WebhookClient({ url: Web });

const guildId = client.config.GUILD_ID;

const govtJobs = ["ambulance", "police", "reporter", "taxi"];
const businessJobs = ["ff", "uwu", "mechanic1", "gc", "dealer2", "primeoil", "hcs",
    "dealer1", "govt", "gasngo", "ssc", "smc", "logistics",
    "darkgas", "snh", "r69", "nexusoil", "nexusoil", "ht"];

//---------------------------------------------------------

router.use(authenticateAPIKey);

router.post('/roleedit', async (req, res) => {
    var { userId, targetId, action, job, playerCitiID, targetCitiID } = req.body;
    if (!playerCitiID || !targetCitiID) {
        playerCitiID = "No Citizen ID";
        targetCitiID = "No Citizen ID";
    }

    if (!action || !job) {
        return res.status(404).json({ success: false, message: 'No Action or Job' });
    }

    var embed = new EmbedBuilder()
        .setFields(
            { name: `User`, value: `<@${userId}>\n\`\`\`${playerCitiID}\`\`\`` },
            { name: `Target`, value: `<@${targetId}>\n\`\`\`${targetCitiID}\`\`\`` }
        )
        .setTimestamp();

    try {

        const guild = await client.guilds.fetch(guildId);

        if (!userId || !targetId) {
            return res.status(404).json({ success: false, message: 'No User or Target ID' });
        }

        const member = await guild.members.fetch(userId);
        const targetMember = await guild.members.fetch(targetId);

        if (!member || !targetMember) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        //Business / Gangs

        if (businessJobs.includes(job)) {

            const businessJobRoles = client.jobs.BUSINESS.JOBS;
            for (const businessJobRole of businessJobRoles) {
                if (businessJobRole.name === job) {
                    if (member.roles.cache.has(businessJobRole.role)) {
                        if (action === 'add') {
                            embed.setColor('Green')
                                .setTitle(`\`Role: ${job} Added\``);
                            await targetMember.roles.add(businessJobRole.role);
                            res.status(200).json({ success: true, message: `Added role to ${targetMember.user.tag}` });
                            break;
                        } else if (action === 'remove') {
                            embed.setColor('Red')
                                .setTitle(`\`Role: ${job} Removed\``);
                            await targetMember.roles.remove(businessJobRole.role);
                            res.status(200).json({ success: true, message: `Removed role from ${targetMember.user.tag}` });
                            break;
                        } else {
                            res.status(400).json({ success: false, message: 'Invalid action' });
                            break;
                        }
                    } else {
                        res.status(400).json({ success: false, message: 'Invalid action | The user has no role' });
                        break;
                    }
                }
            }
            await webhookClient.send({
                username: 'FiveM Business Role',
                avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1144282022295113748/jobs_660_130920052343_291020052310.png",
                embeds: [embed],
            });
        }

        //Govt

        if (govtJobs.includes(job)) {

            const govtRoles = [
                {
                    "name": "ambulance",
                    "role": client.jobs.EMS.ROLEID,
                    "interview": client.jobs.EMS.INTERVIEW
                },
                {
                    "name": "police",
                    "role": client.jobs.PD.ROLEID,
                    "interview": client.jobs.PD.INTERVIEW
                },
                {
                    "name": "reporter",
                    "role": client.jobs.MEDIA.ROLEID,
                    "interview": client.jobs.MEDIA.INTERVIEW
                },
                {
                    "name": "taxi",
                    "role": client.jobs.TAXI.ROLEID,
                    "interview": client.jobs.TAXI.INTERVIEW
                }
            ];

            for (const govtRole of govtRoles) {
                if (govtRole.name === job) {
                    if (member.roles.cache.has(govtRole.role)) {
                        if (action === 'add') {
                            embed.setColor('Green')
                                .setTitle(`\`Role: ${job} Added\``);
                            await targetMember.roles.add(govtRole.role);
                            await targetMember.roles.remove(govtRole.interview);
                            res.status(200).json({ success: true, message: `Added role to ${targetMember.user.tag}` });
                            break;
                        } else if (action === 'remove') {
                            embed.setColor('Red')
                                .setTitle(`\`Role: ${job} Removed\``);
                            await targetMember.roles.remove(govtRole.role);
                            await targetMember.roles.remove(govtRole.interview);
                            res.status(200).json({ success: true, message: `Removed role from ${targetMember.user.tag}` });
                            break;
                        } else {
                            return res.status(400).json({ success: false, message: 'Invalid action' });
                        }
                    } else {
                        res.status(400).json({ success: false, message: 'Invalid action | The user has no role' });
                        break;
                    }
                }
            }
            await webhookClient.send({
                username: 'FiveM Job Role',
                avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1144282022295113748/jobs_660_130920052343_291020052310.png",
                embeds: [embed],
            });
        }

    } catch (error) {
        console.error('Error processing role edit:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while processing role edit' });
    }
});

module.exports = router;