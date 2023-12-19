const {
    AttachmentBuilder
} = require('discord.js');

const Canvas = require('@napi-rs/canvas');
const fs = require('fs');
const { request } = require('undici');

async function genImage(fontPath, imgPath, text) {

    const fontFile = fs.readFileSync(fontPath);
    Canvas.GlobalFonts.registerFromPath(fontFile.toString(), 'Sigmar-Regular');
    const canvas = Canvas.createCanvas(600, 300);
    const context = canvas.getContext('2d');

    const background = await Canvas.loadImage(imgPath);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#0099ff';
    context.strokeRect(0, 0, canvas.width, canvas.height);

    const applyText = (canvas, text) => {
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
}

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

module.exports = { genImage, checkNumberEnding };