const {
    EmbedBuilder,
    Events
} = require('discord.js');

//MEMBER UPDATE
module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {

        if (oldMember.guild.id == client.glog.GUILDID) return;

        //Role Log
        if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            const roleEmbed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() })
                .setTimestamp()
            await oldMember.roles.cache.forEach(role => {
                if (!newMember.roles.cache.has(role.id)) {
                    roleEmbed.addFields(
                        { name: "Role Removed", value: role.name }
                    );
                }
            });
            return await client.channels.cache.get(client.glog.MEMBER.ROLE).send({
                embeds: [roleEmbed]
            });
        } else if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            const roleEmbed = new EmbedBuilder()
                .setColor("Green")
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() })
                .setTimestamp()
            await newMember.roles.cache.forEach(role => {
                if (!oldMember.roles.cache.has(role.id)) {
                    roleEmbed.addFields(
                        { name: "Role Added", value: role.name }
                    );
                }
            });
            return await client.channels.cache.get(client.glog.MEMBER.ROLE).send({
                embeds: [roleEmbed]
            });
        }


        //NICKNAME UPDATE
        const nicknameChan = client.channels.cache.get(client.glog.MEMBER.NICK)
        if (oldMember.nickname == newMember.nickname) return;
        if (!oldMember.nickname && newMember.nickname) {
            const nickEmbed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() })
                .setDescription(`**"${newMember.nickname}" Nickname Added**`)
                .setTimestamp()

            return await nicknameChan.send({
                embeds: [nickEmbed]
            });
        }
        if (oldMember.nickname && !newMember.nickname) {
            const nickEmbed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() })
                .setDescription(`**"${oldMember.nickname}" Nickname Removed**`)
                .setTimestamp()

            return await nicknameChan.send({
                embeds: [nickEmbed]
            });
        }
        if (oldMember.nickname && newMember.nickname) {
            const nickEmbed = new EmbedBuilder()
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() })
                .setDescription(`**Nickname Changed**`)
                .addFields(
                    { name: "Before", value: oldMember.nickname },
                    { name: "After", value: newMember.nickname }
                )
                .setTimestamp()

            return await nicknameChan.send({
                embeds: [nickEmbed]
            });
        }
    }
}