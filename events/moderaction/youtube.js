const { Events, EmbedBuilder } = require("discord.js");
const axios = require('axios');
require("dotenv").config();
const Key = process.env.GOOGLE_KEY;

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.channel.id !== client.config.YT.CHANID) return;

        const wordsToDelete = ['#kdrp', 'kdrp', '#strp', 'strp', 'vanmam', 'vanman','soker', 'clown', '.exe', 'exe', 'dd0s', 'ddos', 'hacker', 'hack', 'sombu', 'expose', 'exposeeee'];

        async function fetchVideoInfo(link) {
            const videoId = extractVideoId(link);
            if (!videoId) {
                throw new Error('Invalid YouTube link');
            }

            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${Key}`);
            const videoInfo = response.data.items[0].snippet;

            return {
                title: videoInfo.title,
            };
        }

        function extractVideoId(link) {
            const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^"&?/\s]{11})/;

            const match = link.match(youtubeRegex);
            if (match) {
                return match[1];
            } else {
                return null;
            }
        }

        function containsWordToDelete(title) {
            const lowerCaseTitle = title.toLowerCase();
            for (const word of wordsToDelete) {
                if (lowerCaseTitle.includes(word.toLowerCase())) {
                    return true;
                }
            }
            return false;
        }

        const youtubeLinkRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([\w-]{11})/g;
        const youtubeLinks = message.content.match(youtubeLinkRegex);
        const allLinks = message.content.match(/(https?:\/\/[^\s]+)/g);

        if ((!youtubeLinks || youtubeLinks.length === 0) && allLinks) {
            await message.delete().then(async () => {

                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('***Link Deleted | Not Youtube Link***')
                    .addFields(
                        { name: 'User', value: `<@${message.author.id}>` },
                        { name: 'Link', value: `${allLinks}` }
                    );

                await client.channels.cache.get(client.config.YT.LOG).send({ embeds: [embed] });

                const deletionMessage = await message.channel.send({
                    content: `<@${message.author.id}>, **your promotion link has been deleted (Not a YT Link!)**`
                });
                setTimeout(function () {
                    deletionMessage.delete();
                }, 4000);
            });
            return;
        }

        if (youtubeLinks) {
            for (const link of youtubeLinks) {
                try {
                    const videoInfo = await fetchVideoInfo(link);
                    if (containsWordToDelete(videoInfo.title)) {
                        await message.delete().then(async () => {

                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setDescription('***Youtube Link Deleted | Automod***')
                                .addFields(
                                    { name: 'User', value: `<@${message.author.id}>` },
                                    { name: 'Youtube Link', value: `${link}` },
                                    { name: 'Youtube Title', value: `${videoInfo.title}` }
                                );

                            await client.channels.cache.get(client.config.YT.LOG).send({ embeds: [embed] });

                            const deletionMessage = await message.channel.send({
                                content: `<@${message.author.id}>, **your promotion link has been deleted (Automod)**`
                            });
                            setTimeout(function () {
                                deletionMessage.delete();
                            }, 4000);
                        });
                    }
                } catch (error) {
                    console.error('Error fetching video info:', error);
                }
            }
        }
    }
};