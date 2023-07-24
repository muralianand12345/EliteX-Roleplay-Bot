const { WebhookClient } = require('discord.js');

module.exports={
    async glog(username_glog="unknown", embed_glog="unknown")
    {
        const webhookClient = new WebhookClient({ url: 'https://discord.com/api/webhooks/1132887743760973854/TMjOkVvdoZz0htrr7L8HEvmmQB4bwt_MegkKQkbKqvejrcprBFWDduofVaYndnV7rIvo' });
        await webhookClient.send({
            username: username_glog,
            avatarURL: "https://img.freepik.com/free-vector/flat-design-spiral-book-mockup_23-2149567582.jpg?w=2000",
            embeds: [embed_glog],
        });
    }
};