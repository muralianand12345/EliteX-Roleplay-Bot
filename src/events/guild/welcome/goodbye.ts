import { Events } from "discord.js";

import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {

        if (!member.guild) return;
        if (!client.config.welcome.goodbyemsg.enabled) return;

        const goodbyeUserData = {
            guildId: client.config.welcome.goodbyemsg.guildId,
            channelId: client.config.welcome.goodbyemsg.channelId
        };

        if (member.guild.id !== goodbyeUserData.guildId) return;

        const chan = client.channels.cache.get(goodbyeUserData.channelId);
        if (!chan) return;

        const msg = client.config.welcome.goodbyemsg.message
            .replace(/{user}/g, member.user.tag)
            .replace(/{usermention}/g, `<@${member.user.id}>`)
            .replace(/{userid}/g, member.user.id)
            .replace(/{server}/g, member.guild.name)
            .replace(/{membercount}/g, member.guild.memberCount);

        await client.channels.cache.get(chan).send({
            content: msg
        });
    }
};

export default event;