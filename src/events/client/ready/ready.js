var colors = require('colors/safe');
const {
    EmbedBuilder,
    ActivityType,
    Events
} = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    execute(client) {
        console.log(colors.rainbow(`${client.user.tag} Bot is ready to rock n roll!`));

        //Err
        const err_chanid = client.config.ERR_LOG.CHAN_ID;
        const err_logchan = client.channels.cache.get(err_chanid);

        const activities = [
            { name: `Indian Community`, type: ActivityType.Competing },
            { name: `Iconic RolePlay ❤️`, type: ActivityType.Playing },
            { name: `your Feedback and Suggestions!`, type: ActivityType.Listening },
            { name: `${client.users.cache.size} Users!`, type: ActivityType.Watching },
            { name: `#tamilcommunityrp`, type: ActivityType.Competing },
        ];
        //client.user.setStatus('invisible');
        let i = 0;
        setInterval(() => {
            if (i >= activities.length) i = 0;
            //client.user.setPresence({ activities: [{ name: activities[i] }], status: 'invisible' });
            client.user.setActivity(activities[i]);
            i++;
        }, 5000);

        //Restart Embed Message
        const embed = new EmbedBuilder()
            .setColor('#E67E22')
            .setTitle(`Bot Restart Completed and Online ❤️`)
            .setTimestamp();
        err_logchan.send({ embeds: [embed] });
    },
};