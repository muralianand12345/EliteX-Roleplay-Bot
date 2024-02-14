const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const { request } = require('undici');

const client = require('../../../../../bot.js');
const userLoginWeb = require('../../../../database/modals/userLoginWeb.js');

const WebLogin = client.config.web.login.webhook;
const allowRoleID = client.config.web.login.guild.allowRoleID;
const ServerAdd = process.env.SERVERADD;
const clientSceret = process.env.CLIENT_SECRET;
const guildId = client.config.web.login.guild.id;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later.' }
});
const webhookClientLogin = new WebhookClient({ url: WebLogin });

router.get('/discordauth', limiter, async (req, res) => {

    const { query } = req;
    const { code } = query;

    if (code) {
        try {

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ message: 'Guild not found' });
            }

            const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: client.user.id,
                    client_secret: clientSceret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `${ServerAdd}/auth/discordauth`,
                    scope: 'identify email connections guilds',
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const oauthData = await tokenResponseData.body.json();

            const userResult = await request('https://discord.com/api/users/@me', {
                headers: {
                    authorization: `${oauthData.token_type} ${oauthData.access_token}`,
                },
            });

            const userData = await userResult.body.json();

            if (!userData) return res.status(404).json({ message: 'User not found' });
            if (!userData.id) return res.status(404).json({ message: 'User not found' });

            const user = await userLoginWeb.findOne({ discordId: userData.id });

            if (!user) {
                const newUser = new userLoginWeb({
                    discordId: userData.id,
                    discordUsername: userData.username,
                    discordAvatar: userData.avatar,
                    email: userData.email,
                });

                await newUser.save();
            } else {
                user.discordUsername = userData.username;
                user.discordAvatar = userData.avatar;
                user.email = userData.email;
                await user.save();
            }

            const embed = new EmbedBuilder()
                .setDescription('**User Trying to Login**')
                .setColor('Yellow')
                .setFields(
                    { name: `User Tag`, value: `<@${userData.id}>` },
                    { name: `UserID`, value: `${userData.id}` },
                    { name: `User Email`, value: `${userData.email}` }
                );
            await webhookClientLogin.send({
                username: 'User Login',
                avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
                embeds: [embed],
            });

            const userMember = guild.members.cache.get(userData.id);

            if (!userMember) {
                return res.send(`You are not allowed to login | Error: Not in Server | Please join the server ${client.config.web.login.guild.serverInvite}`);
            }

            const hasRole = allowRoleID.some(allowRoleID => userMember.roles.cache.has(allowRoleID));

            if (hasRole) {
                const embed = new EmbedBuilder()
                    .setDescription('**User Logged In**')
                    .setColor('Green')
                    .setFields(
                        { name: `User Tag`, value: `<@${userData.id}>` },
                        { name: `UserID`, value: `${userData.id}` },
                        { name: `User Email`, value: `${userData.email}` }
                    );

                await webhookClientLogin.send({
                    username: 'User Login',
                    avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
                    embeds: [embed],
                });

                req.session.isLoggedIn = true;
                res.redirect('/home');
            } else {
                res.send(`You are not allowed to login | Error: Missing Role | Please contact the server admin ${client.config.web.login.guild.serverInvite}`);
            }

        } catch (error) {
            client.logger.error("WEB LOGIN ERROR", error);
        }
    }
});

module.exports = router;