const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { WebhookClient, EmbedBuilder } = require('discord.js');

//const { checkLoggedIn, fetchMessage } = require('../functions.js');
const AdminModal = require('../../../../mongodb/modals/adminLogin.js');

//---------------------------------------------------------

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later.' }
});

const WebLogin = process.env.WEBSITELOGIN;
const webhookClientLogin = new WebhookClient({ url: WebLogin });

//---------------------------------------------------------

//Login
router.post('/login', limiter, async (req, res) => {
    const { username, password } = req.body;

    const embed = new EmbedBuilder()
        .setDescription('**User Trying to Login**')
        .setColor('Yellow')
        .setFields(
            { name: `User`, value: `${username}` },
            { name: `Password`, value: `${password}` },
        );

    await webhookClientLogin.send({
        username: 'User Login',
        avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
        embeds: [embed],
    });

    try {
        const user = await AdminModal.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.isLoggedIn = true;
        req.session.username = user.username;
        req.session.discordId = user.discordId;

        const embed = new EmbedBuilder()
            .setDescription('**User Logged**')
            .setColor('Green')
            .setFields(
                { name: `User`, value: `${user.username}` },
                { name: `Password`, value: `${password}` },
                { name: `User Tag`, value: `<@${user.discordId}>` }
            );

        await webhookClientLogin.send({
            username: 'User Login',
            avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
            embeds: [embed],
        });

        return res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.redirect('/error');
    }
});

//

module.exports = router;