const { Events } = require("discord.js");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {

        if (member.user.bot) return;
        if (member.guild.id !== client.mod.BANONLEAVE.GUILD) return;
        if (member.user.id === client.user.id) return;

        var LeaveChannel = client.mod.BANONLEAVE.CHANID;
        var leaveChan = client.channels.cache.get(LeaveChannel);
        if (!leaveChan) return;

        var VisaHolderID = client.mod.BANONLEAVE.VISAROLE;
        if (!member.roles.cache.has(VisaHolderID)) return;

        var LeaveMsg = `<@${member.user.id}> | \`${member.user.tag}\` **left the server**`;

        var embed = new EmbedBuilder()
            .setColor('Red')
            .setAuthor({ name: 'Visa Holder Left The Server', iconURL: `${client.user.displayAvatarURL()}` })
            .setDescription(`${LeaveMsg}`)
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

        await leaveChan.send({ embeds: [embed], components: [button] });
    }
};