import { Guild, GuildMember, Message, TextChannel } from "discord.js";


const getMentioned = (message: Message) => {
    
    //Member
    const member = message.member as GuildMember;
    const userRoles = member.roles.cache
        .filter(role => role.name !== '@everyone')
        .map(role => role.name)
        .join(', ');
    const userJoinDate = member.joinedAt?.toDateString();
    const userDetailText = `Server Name: ${member.nickname} [Use this name to mention user] | Discord Name ${message.author.username} | User ID: ${message.author.id} | User Tag: ${message.author.tag} | User Avatar: ${message.author.displayAvatarURL()}`;

    //Channel
    const channel = message.channel as TextChannel;
    const channelInfo = `Channel: ${channel.name} | Type: ${channel.type} | Topic: ${channel.topic}`;

    //Guild
    const guild = message.guild as Guild;
    const serverInfo = `Server: ${guild.name} | Members: ${guild.memberCount} | Roles: ${guild.roles.cache.size}`;

    //Mentioned Users
    const mentionedUsers = message.mentions.users.map(user => {
        const mentionedMember = guild.members.cache.get(user.id);
        return `${user.username} (${user.id}) | Roles: ${mentionedMember?.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name)
            .join(', ')} | Join Date: ${mentionedMember?.joinedAt?.toDateString()}`;
    }).join('\n');

    //Mentioned Channels
    const mentionedChannels = message.mentions.channels.map((channel: any) =>
        `#${channel.name} | Type: ${channel.type} | Topic: ${channel.topic}`
    ).join('\n');

    //Mentioned Roles
    const mentionedRoles = message.mentions.roles.map(role =>
        `@${role.name} | Color: ${role.hexColor} | Members: ${role.members.size} | Position: ${role.position}`
    ).join('\n');

    return `
        User Details: ${userDetailText}
        User Roles: ${userRoles}
        User Join Date: ${userJoinDate}
        ${channelInfo}
        ${serverInfo}
        Mentioned Users:
        ${mentionedUsers}
        Mentioned Channels:
        ${mentionedChannels}
        Mentioned Roles:
        ${mentionedRoles}
        `;
}

export { getMentioned };