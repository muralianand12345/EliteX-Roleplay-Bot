const {
    Events
} = require('discord.js');

const path = require('path');

const welcomeUserModal = require('../../database/modals/welcomeUser.js');
const { genImage, checkNumberEnding } = require('./function/function.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {

        if (!member.guild) return;
        if (!client.config.welcome.welcomeuser.enabled) return;

        var welcomeUserData = await welcomeUserModal.findOne({
            guildId: member.guild.id
        });

        if (!welcomeUserData) return;

        const chan = welcomeUserData.welcomeChanId;

        const fontFilePath = path.join(__dirname, 'fonts', 'Sigmar-Regular.ttf');
        const imgFilePath = path.join(__dirname, 'images', 'welcome_irp.png');
        const text = 'WELCOME';
        const attachment = await genImage(fontFilePath, imgFilePath, text);

        await member.guild.members.fetch().then(async (fetchedMembers) => {
            const count = Array.from(fetchedMembers)
                .sort((a, b) => a[1].joinedAt - b[1].joinedAt)
                .findIndex(m => m[0] === member.id) + 1;

            const ends = checkNumberEnding(count);
            const currCount = `${count}${ends}`;

            const msg = client.config.welcome.welcomeuser.message
                .replace(/{count}/g, currCount)
                .replace(/{user}/g, member.user.tag)
                .replace(/{usermention}/g, `<@${member.user.id}>`)
                .replace(/{userid}/g, member.user.id)
                .replace(/{server}/g, member.guild.name)
                .replace(/{membercount}/g, currCount);

            await client.channels.cache.get(chan).send({
                content: msg,
                files: [attachment]
            });
        }).catch(err => client.logger.error(`Error while fetching members for ${member.guild.name} (${member.guild.id}): ${err}`));
    }
}