import { Events, TextChannel, AttachmentBuilder, GuildMember } from "discord.js";
import path from 'path';
import fs from 'fs';
import { request } from 'undici';
import Canvas from '@napi-rs/canvas';

import { BotEvent } from "../../../types";

const genImage = async (member: GuildMember, fontFilePath: string, imgFilePath: string, text: string) => {
    const fontFile = fs.readFileSync(fontFilePath);
    Canvas.GlobalFonts.registerFromPath(fontFile.toString(), 'Sigmar-Regular');
    const canvas = Canvas.createCanvas(600, 300);
    const context = canvas.getContext('2d');

    const background = await Canvas.loadImage(imgFilePath);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#0099ff';
    context.strokeRect(0, 0, canvas.width, canvas.height);

    const applyText = (canvas: any, text: string) => {
        const context = canvas.getContext('2d');
        let fontSize = 80;
        do {
            context.font = `bold ${fontSize -= 10}px Sigmar-Regular`;
        } while (context.measureText(text).width > canvas.width - 300);
        return context.font;
    };

    const font = applyText(canvas, text);
    context.font = font;
    context.fillStyle = '#FFFFFF';
    const textWidth = context.measureText(text).width;
    context.fillText(text, (canvas.width - textWidth) / 2, 240);

    context.font = `bold ${font}`;
    context.strokeStyle = '#000000';
    context.lineWidth = 0.1;
    context.shadowColor = '#000000';
    context.shadowBlur = 20;
    context.strokeText(text, (canvas.width - textWidth) / 2, 240);

    const userTag = member.user.tag;
    const tagFont = applyText(canvas, userTag);
    context.font = tagFont;
    context.fillStyle = "#FFFFFF";
    const tagWidth = context.measureText(userTag).width;
    context.fillText(userTag, (canvas.width - tagWidth) / 2, 275);

    context.font = `bold ${tagFont}`;
    context.strokeStyle = '#000000';
    context.lineWidth = 0.1;
    context.shadowColor = '#000000';
    context.shadowBlur = 20;
    context.strokeText(userTag, (canvas.width - tagWidth) / 2, 275);

    context.beginPath();
    context.arc(300, 100, 80, 0, Math.PI * 2, true);
    context.strokeStyle = 'white';
    context.lineWidth = 10;
    context.stroke();
    context.closePath();
    context.clip();

    const { body } = await request(member.user.displayAvatarURL({ extension: 'jpg' }));
    const avatar = await Canvas.loadImage(await body.arrayBuffer());
    context.drawImage(avatar, 210, 20, 175, 175);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
};

const checkNumberEnding = (number: number) => {
    const endingDigit = number % 10;
    if (endingDigit === 0 || endingDigit > 3 && endingDigit < 10 || number > 10 && number < 20) {
        return "th";
    } else if (endingDigit === 1) {
        return "st";
    } else if (endingDigit === 2) {
        return "nd";
    } else if (endingDigit === 3) {
        return "rd";
    } else {
        return;
    }
};

const event: BotEvent = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {

        if (!member.guild) return;
        if (!client.config.welcome.welcomeuser.enabled) return;

        const welcomeUserData = {
            guildId: client.config.welcome.welcomeuser.guildId,
            channelId: client.config.welcome.welcomeuser.channelId
        };

        if (member.guild.id !== welcomeUserData.guildId) return;

        const chan = client.channels.cache.get(welcomeUserData.channelId) as TextChannel;
        if (!chan) return;

        const fontFilePath: string = path.join('assets', 'SigmarOne-Regular.ttf');
        const imgFilePath: string = path.join('assets', 'welcome_irp.png');
        if (!fontFilePath || !imgFilePath) return;

        const text: string = "WELCOME";
        const attachment = await genImage(member, fontFilePath, imgFilePath, text);

        await member.guild.members.fetch().then(async (fetchedMembers: any) => {
            const count = Array.from(fetchedMembers)
                .sort((a: any, b: any) => a[1].joinedAt - b[1].joinedAt)
                .findIndex((m: any) => m[0] === member.id) + 1;

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
        }).catch((err: Error) => client.logger.error(`Error while fetching members for ${member.guild.name} (${member.guild.id}): ${err}`));
    }
};

export default event;