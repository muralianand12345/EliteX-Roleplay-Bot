const { Events } = require("discord.js");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const banOPLeaveModal = require('../../database/modals/banOnLeave.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {

        if (!client.config.banonleave.enabled) return;
        if (member.user.bot) return;
        if (member.user.id === client.user.id) return;

        var banOPLeaveData = await banOPLeaveModal.findOne({
            guildID: member.guild.id
        }).catch((err) => { return; });

        if (!banOPLeaveData) return;
        if (banOPLeaveData.status === false) return;

        var chanBanMsgID = banOPLeaveData.chanID;
        var chanBanMsg = member.guild.channels.cache.get(chanBanMsgID);
        if (!chanBanMsg) return;

        var roleIDList = banOPLeaveData.roles;
        var roleList = roleIDList.map(role => role.roleID);

        if (banOPLeaveData.single === true) {
            if (!roleList.some(roleID => member.roles.cache.has(roleID))) return;
        } else {
            if (!roleList.every(roleID => member.roles.cache.has(roleID))) return;
        }

        var LeaveMsg = `<@${member.user.id}> | \`${member.user.tag}\` **left the server**`;

        var embed = new EmbedBuilder()
            .setColor('Red')
            .setAuthor({ name: 'Visa Holder Left The Server', iconURL: `${client.user.displayAvatarURL()}` })
            .setFooter({ text: `${member.user.id}` })
            .setTimestamp();
        var button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('banonleave-ban')
                    .setLabel('Ban')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔨')
            );

        const banReason = `Visa Holder Left The Server`;

        if (banOPLeaveData.action === 'ban') {

            if (banOPLeaveData.type === "instant") {
                embed.setDescription(`${LeaveMsg}\n\n**Action:** Banned`);
                await member.guild.members.ban(member.user.id, { reason: banReason });
                await chanBanMsg.send({ embeds: [embed] });
                banOPLeaveData.count += 1;
                await banOPLeaveData.save();

            } else if (banOPLeaveData.type === "message") {
                embed.setDescription(`${LeaveMsg}`);
                await chanBanMsg.send({ embeds: [embed], components: [button] });
            }
        }
    }
};