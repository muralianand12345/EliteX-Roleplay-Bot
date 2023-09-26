const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const { request } = require('undici');

//const { checkLoggedIn, fetchMessage } = require('../functions.js');
const AdminModal = require('../../../../mongodb/modals/adminLogin.js');
const client = require('../../../../../bot.js');

//---------------------------------------------------------

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later.' }
});

const clientSceret = process.env.CLIENT_SECRET;
const clientID = process.env.CLIENT_ID;
const ServerAdd = process.env.SERVERADD;
const guildId = client.config.GUILD_ID;
const allowRoleID = client.website.AUTH.ALLOWROLE;

const WebLogin = process.env.WEBSITELOGIN;
const webhookClientLogin = new WebhookClient({ url: WebLogin });

//---------------------------------------------------------

//Login
router.get('/discordauth', limiter, async (req, res) => {

    const { query } = req;
    const { code } = query;

    if (code) {
        try {
            const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: clientID,
                    client_secret: clientSceret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `${ServerAdd}/discordauth`,
                    scope: 'identify',
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

            var userLogin = await AdminModal.findOne({ discordId: userData.id });

            if (!userLogin) {
                userLogin = new AdminModal({
                    discordId: userData.id,
                    discordUsername: userData.username,
                    discordAvatar: userData.avatar,
                });
                await userLogin.save();
            } else {
                userLogin.discordUsername = userData.username;
                userLogin.discordAvatar = userData.avatar;
                await userLogin.save();
            }

            req.session.user = userData;
            req.session.username = userData.username;
            req.session.discordId = userData.id;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ message: 'Guild not found' });
            }

            const embed = new EmbedBuilder()
                .setDescription('**User Trying to Login**')
                .setColor('Yellow')
                .setFields(
                    { name: `User Tag`, value: `<@${userData.id}>` },
                    { name: `UserID`, value: `${userData.id}` },
                );
            await webhookClientLogin.send({
                username: 'User Login',
                avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
                embeds: [embed],
            });

            const userMember = guild.members.cache.get(userData.id);
            const hasManagerRole = allowRoleID.some(allowRoleID => userMember.roles.cache.has(allowRoleID));

            if (hasManagerRole) {
                const embed = new EmbedBuilder()
                    .setDescription('**User Logged**')
                    .setColor('Green')
                    .setFields(
                        { name: `User Tag`, value: `<@${userData.id}>` },
                        { name: `UserID`, value: `${userData.id}` },
                    );

                await webhookClientLogin.send({
                    username: 'User Login',
                    avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
                    embeds: [embed],
                });
                req.session.isLoggedIn = true;
            }

            if (hasManagerRole) {
                res.redirect('/admin');
            } else {
                res.redirect('/');
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});


module.exports = router;