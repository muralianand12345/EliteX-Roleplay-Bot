const { Events } = require('discord.js');
const { hyperlink } = require('../../client/commands/functions/format.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        /*var reminderChanId = "1147600006283542589";
        var visaRoleChanId = "1103705889921314956";
        var communityRoleId = "1096856106749394994";
        var chan = await client.channels.cache.get(reminderChanId);  

        var msg = `Dear <@&${communityRoleId}>, please apply for the visa role by completing the ${hyperlink("**Visa Form**", "https://forms.gle/EjG7JLq8G5cZC4oc9")}. Afterward, obtain your role by visiting <#${visaRoleChanId}>!`;

        setInterval(() => {
            chan.send(msg);
        }, 1000 * 60 * 60); //1 hr*/
    
    }
}