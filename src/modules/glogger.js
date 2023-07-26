const { WebhookClient } = require('discord.js');
require("dotenv").config();
const Web = process.env.GLOGWEB;

module.exports={
    async glog(username_glog="unknown", embed_glog="unknown")
    {
        const webhookClient = new WebhookClient({ url: Web });
        await webhookClient.send({
            username: username_glog,
            avatarURL: "https://img.freepik.com/free-vector/flat-design-spiral-book-mockup_23-2149567582.jpg?w=2000",
            embeds: [embed_glog],
        });
    }
};