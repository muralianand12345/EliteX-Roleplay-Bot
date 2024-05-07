const { Events } = require("discord.js");
const axios = require('axios');
require("dotenv").config();
const Key = process.env.GOOGLE_KEY;

const promotionGuild = require('../../database/modals/promotionGuild.js');
const bannedUsers = require('../../database/modals/bannedUsers.js');

const youtubeLinkRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([\w-]{11})/g;
const youtubeIDRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^"&?/\s]{11})/;
const allLinkRegex = /(https?:\/\/[^\s]+)/g;

async function fetchVideoInfo(link, youtubeIDRegex) {
    let videoId = await extractVideoId(link, youtubeIDRegex);
    if (!videoId) throw new Error('Invalid YouTube link');
    let response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${Key}`);
    let videoInfo = response.data.items[0].snippet;
    return videoInfo;
}

async function checkYTLink(link, youtubeRegex, alllinkRegex) {
    let youtubeLinks = link.match(youtubeRegex);
    let allLinks = link.match(alllinkRegex);
    if ((!youtubeLinks || youtubeLinks.length === 0) && (!allLinks || allLinks.length === 0)) return false;
    return true;
}

function extractVideoId(link, youtubeIDRegex) {
    let match = link.match(youtubeIDRegex);
    if (match) return match[1];
    return null;
}

async function checkYTChannel(link, blockedChannelList) {
    let channelInfo = await fetchVideoInfo(link, youtubeIDRegex);
    let channelName = channelInfo.channelTitle;
    if (blockedChannelList.includes(channelName)) return true;
    return false;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (!client.config.moderation.promotion.enabled) return;
        if (!message.guild) return;
        if (message.author.bot) return;

        var promotionData = await promotionGuild.findOne({
            guildId: message.guild.id
        }).catch((err) => { return client.logger.error(err); });

        if (!promotionData) return;
        if (!promotionData.channelId.includes(message.channel.id)) return;

        const blockedList = promotionData.blockedList;
        const content = message.content;

        const bannedUsersData = await bannedUsers.findOne({
            userId: message.author.id
        }).catch((err) => { return client.logger.error(err); });

        if (bannedUsersData) {
            if (bannedUsersData.ban.some(x => x.bantype === 'promotion' && x.status === true)) {
                var userBlockedChannelList = [];
                bannedUsersData.ban.forEach(x => {
                    if (x.bantype === 'promotion' && x.status === true) {
                        userBlockedChannelList.push(x.keyWord);
                    }
                });

                if (checkYTChannel(content, userBlockedChannelList)) {

                    await message.delete().then(async () => {
                        msg = await message.channel.send({ content: `<@${message.author.id}>, **your promotion link has been deleted (Blocked Channel)**` });

                        client.logger.log(`[PROMOTION] ${message.author.tag} (${message.author.id}) has been warned for posting a blocked channel in the promotion channel.`);

                        const reason = bannedUsersData.ban.find(x => x.bantype === 'promotion').reason;
                        if (reason) {
                            message.author.send({ content: `**Your promotion link has been deleted in "${message.guild.name}" for the following reason:**\n\`${reason}\`` }).catch(() => { });
                        }

                        promotionData.count += 1;
                        var user = promotionData.blockedUsers.find(x => x.userId === message.author.id);
                        if (user) {
                            user.count += 1;
                            user.contents.push({ content: message.content });
                        } else {
                            promotionData.blockedUsers.push({ userId: message.author.id, count: 1, contents: [{ content: message.content }] });
                        }
                        await promotionData.save();

                        setTimeout(() => {
                            msg.delete();
                        }, 5000);
                    });

                }
            }
        }

        if (!checkYTLink(content, youtubeLinkRegex, allLinkRegex)) {
            await message.delete().then(async () => {
                msg = await message.channel.send({ content: `<@${message.author.id}>, **your promotion link has been deleted (Not a YT Link!)**` });

                client.logger.log(`[PROMOTION] ${message.author.tag} (${message.author.id}) has been warned for posting a non-youtube link in the promotion channel.`);

                promotionData.count += 1;
                var user = promotionData.blockedUsers.find(x => x.userId === message.author.id);
                if (user) {
                    user.count += 1;
                    user.contents.push({ content: message.content });
                } else {
                    promotionData.blockedUsers.push({ userId: message.author.id, count: 1, contents: [{ content: message.content }] });
                }
                await promotionData.save();

                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
            return;

        } else {

            const videoId = extractVideoId(content, youtubeIDRegex);
            if (!videoId) {
                await message.delete().then(async () => {
                    msg = await message.channel.send({ content: `<@${message.author.id}>, **your promotion link has been deleted (Invalid YT Link!)**` });

                    client.logger.log(`[PROMOTION] ${message.author.tag} (${message.author.id}) has been warned for posting an invalid youtube link in the promotion channel.`);

                    promotionData.count += 1;
                    var user = promotionData.blockedUsers.find(x => x.userId === message.author.id);
                    if (user) {
                        user.count += 1;
                        user.contents.push({ content: message.content });
                    } else {
                        promotionData.blockedUsers.push({ userId: message.author.id, count: 1, contents: [{ content: message.content }] });
                    }
                    await promotionData.save();

                    setTimeout(() => {
                        msg.delete();
                    }, 5000);
                }).catch(() => { 
                    client.logger.error(`[PROMOTION] Unable to delete message from ${message.author.tag} (${message.author.id}) in ${message.guild.name} (${message.guild.id})`);
                });
                return;
            } else {

                const youtubeInfo = await fetchVideoInfo(content, youtubeIDRegex);
                const youtubeTitle = youtubeInfo.title;
                if (blockedList.some(word => youtubeTitle.toLowerCase().includes(word))) {
                    await message.delete().then(async () => {
                        msg = await message.channel.send({ content: `<@${message.author.id}>, **your promotion link has been deleted (Automod)**` });

                        client.logger.log(`[PROMOTION] ${message.author.tag} (${message.author.id}) has been warned for posting a blocked word in the promotion channel.`);

                        promotionData.count += 1;
                        var user = promotionData.blockedUsers.find(x => x.userId === message.author.id);
                        if (user) {
                            user.count += 1;
                            user.contents.push({ content: message.content });
                        } else {
                            promotionData.blockedUsers.push({ userId: message.author.id, count: 1, contents: [{ content: message.content }] });
                        }
                        await promotionData.save();

                        setTimeout(() => {
                            msg.delete();
                        }, 5000);
                    });
                    return;
                }
            }
        }
    }
}