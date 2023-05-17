const {
    Events,
    AttachmentBuilder
} = require('discord.js');

const Canvas = require('@napi-rs/canvas');
const fs = require('fs');
const { request } = require('undici');

const path = require('path');

const countModel = require('../../events/models/memCount.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {

        if (member.guild.id !== client.welcome.GUILDID) return;

        var memDoc = await countModel.findOne({
            guildID: member.guild.id
        }).catch(err => console.log(err));

        if (!memDoc) {
            memDoc = new countModel({
                guildID: member.guild.id,
                memCount: 0
            });
            await memDoc.save();
        }

        const fontFilePath = path.join(__dirname, 'fonts', 'Sigmar-Regular.ttf');
        const fontFile = fs.readFileSync(fontFilePath);
        Canvas.GlobalFonts.registerFromPath(fontFile.toString(), 'Sigmar-Regular');

        const canvas = Canvas.createCanvas(600, 300);
        const context = canvas.getContext('2d');

        const imgFilePath = path.join(__dirname, 'images', 'welcome_irp.png');
        const background = await Canvas.loadImage(imgFilePath);
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#0099ff';
        context.strokeRect(0, 0, canvas.width, canvas.height);

        //text
        const applyText = (canvas, text) => {
            const context = canvas.getContext('2d');
            let fontSize = 80;
            do {
                context.font = `bold ${fontSize -= 10}px Sigmar-Regular`;
            } while (context.measureText(text).width > canvas.width - 300);
            return context.font;
        };

        const text = 'WELCOME';
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

        //Circle Profile
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

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

        memDoc.memCount += 1;
        await memDoc.save();
        //var count = memDoc.memCount;

        await member.guild.members.fetch().then(async (fetchedMembers) => {
            const count = Array.from(fetchedMembers)
                .sort((a, b) => a[1].joinedAt - b[1].joinedAt)
                .findIndex(m => m[0] === member.id) + 1;

            function checkNumberEnding(number) {
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
            }

            const ends = checkNumberEnding(count);
            const currCount = `${count}${ends}`;

            const welcomeMsg = `<a:welcome:1097130355137454181> <@${member.user.id}> **Welcome to ICONIC Roleplay** <a:welcome:1097130355137454181>\n\n━━━━━━━━▣━━◤<a:dancebear:1097134582102491226>◢━━▣━━━━━━━━\n\n<a:arrow:1097132735086198864> Read our Server Rules at <#${client.welcome.RULEID}>\n\n<a:arrow:1097132735086198864> You can get our branding materials at <#${client.welcome.BRANDID}>\n\n<a:arrow:1097132735086198864> In case of any queries contact our staff at <#${client.welcome.CHATID}>\n\n<a:arrow:1097132735086198864> Thanks for joining here\n\n━━━━━━━━▣━━◤<a:dancebear:1097134582102491226>◢━━▣━━━━━━━━\n\n<a:party:1097134575764914296> You are the ${currCount.toString()} member of ICONIC Roleplay Community <a:party:1097134575764914296>`;
            return await client.channels.cache.get(client.welcome.CHANID).send({ content: welcomeMsg, files: [attachment] });
        });
    }
};