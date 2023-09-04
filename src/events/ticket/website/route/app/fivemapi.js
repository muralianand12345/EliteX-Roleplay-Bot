const express = require('express');
const router = express.Router();
const { WebhookClient, EmbedBuilder } = require('discord.js');
require("dotenv").config();

const { authenticateAPIKey } = require('../functions.js');
const client = require('../../../../../bot.js');
const roleModel = require('../../../../mongodb/modals/roleremove.js');

//---------------------------------------------------------

const Web = process.env.WEBSITEFIVEMROLE;
const webhookClient = new WebhookClient({ url: Web });

const guildId = client.config.GUILD_ID;

const govtJobs = ["ambulance", "customs"];
const gangJobs = ["police", "mechanics"];

//---------------------------------------------------------

router.use(authenticateAPIKey);

router.post('/roleedit', async (req, res) => {
    const { userId, targetId, action, job, playerCitiID, targetCitiID } = req.body;

    var embed = new EmbedBuilder()
        .setFields(
            { name: `User`, value: `<@${userId}>` },
            { name: `Target`, value: `<@${targetId}>` },
            { name: `Player CitizenID`, value: `\`\`\`${playerCitiID}\`\`\`` },
            { name: `Target CitizenID`, value: `\`\`\`${targetCitiID}\`\`\`` },
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

        if (gangJobs.includes(job)) {

            const gangLeaderRole = client.gangs.GANGLEADER;
            const gangRoleList = client.gangs.GANGROLE;

            if (member.roles.cache.has(gangLeaderRole)) {
                for (const gangRole of gangRoleList) {
                    if (member.roles.cache.has(gangLeaderRole) && member.roles.cache.has(gangRole)) {
                        if (action === 'add') {
                            embed.setColor('Green')
                                .setDescription(`\`Role: ${job} Removed\``);
                            await targetMember.roles.add(gangRole);
                            res.status(200).json({ success: true, message: `Added role to ${targetMember.user.tag}` });
                            break;
                        } else if (action === 'remove') {
                            embed.setColor('Red')
                                .setDescription(`\`Role: ${job} Removed\``);
                            await targetMember.roles.remove(gangRole);
                            res.status(200).json({ success: true, message: `Removed role from ${targetMember.user.tag}` });
                            break;
                        } else {
                            res.status(400).json({ success: false, message: 'Invalid action' });
                            break;
                        }
                    }
                }
                await webhookClient.send({
                    username: 'FiveM Gang Role',
                    avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1144282022295113748/jobs_660_130920052343_291020052310.png",
                    embeds: [embed],
                });
            }
        }

        if (govtJobs.includes(job)) {
            const roleMap = {
                PD: {
                    HO: client.jobs.PD.HO,
                    INTERVIEW: client.jobs.PD.INTERVIEW,
                    ROLEID: client.jobs.PD.ROLEID,
                    NAME: client.jobs.PD.NAME
                },
                EMS: {
                    HO: client.jobs.EMS.HO,
                    INTERVIEW: client.jobs.EMS.INTERVIEW,
                    ROLEID: client.jobs.EMS.ROLEID,
                    NAME: client.jobs.EMS.NAME
                },
                TAXI: {
                    HO: client.jobs.TAXI.HO,
                    INTERVIEW: client.jobs.TAXI.INTERVIEW,
                    ROLEID: client.jobs.TAXI.ROLEID,
                    NAME: client.jobs.TAXI.NAME
                },
                MEDIA: {
                    HO: client.jobs.MEDIA.HO,
                    INTERVIEW: client.jobs.MEDIA.INTERVIEW,
                    ROLEID: client.jobs.MEDIA.ROLEID,
                    NAME: client.jobs.MEDIA.NAME
                }
            };

            const selectedRole = Object.values(roleMap).find(job => member.roles.cache.has(job.HO));
            if (!selectedRole) return res.status(403).json({ success: false, message: `You do not have the necessary role to use this command!` });
            const rolecool = guild.roles.cache.get(client.jobs.GOVTCOOL);
            if (!rolecool) return res.status(403).json({ success: false, message: `The "Govt Cool" role does not exist in this guild.` });
            const targetRole = roleMap[selectedRole.NAME];

            if (action === 'add') {
                embed.setColor('Green')
                    .setDescription(`\`Role: ${targetRole.NAME} Added\``);
                //if (targetMember.roles.cache.has(client.jobs.GOVTCOOL)) return res.status(403).json({ success: false, message: `The user has Govt Cooldown role` });
                await targetMember.roles.add(targetRole.ROLEID);
                await targetMember.roles.remove(targetRole.INTERVIEW);
                res.status(200).json({ success: true, message: `Added role to ${targetMember.user.tag}` });

            } else if (action === 'remove') {
                embed.setColor('Red')
                    .setDescription(`\`Role: ${targetRole.NAME} Removed\``);
                const expirationDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
                const newRoleData = new roleModel({
                    userId: member.id,
                    roleId: rolecool.id,
                    expirationDate: expirationDate,
                    guildId: guild.id
                });
                await newRoleData.save();
                await targetMember.roles.remove(targetRole.ROLEID);
                await targetMember.roles.remove(targetRole.INTERVIEW);
                await targetMember.roles.add(rolecool);
                res.status(200).json({ success: true, message: `Removed role from ${targetMember.user.tag}` });

            } else {
                return res.status(400).json({ success: false, message: 'Invalid action' });
            }

            await webhookClient.send({
                username: 'FiveM Job Role',
                avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1144282022295113748/jobs_660_130920052343_291020052310.png",
                embeds: [embed],
            });
        }

    } catch (error) {
        //console.error('Error processing role edit:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while processing role edit' });
    }
});

module.exports = router;