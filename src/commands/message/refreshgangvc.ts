import { Command } from '../../types';
import gangInit from "../../events/database/schema/gangInit";
import { convertToSpecialText } from "../../utils/convertion/text";
import { ChannelType, PermissionsBitField, CategoryChannel } from 'discord.js';

const command: Command = {
    name: 'refreshgangvc',
    description: "Refreshes the gang voice chat.",
    cooldown: 1000,
    owner: true,
    userPerms: [],
    botPerms: ['Administrator'],
    async execute(client, message, args) {
        try {

            if (!message.guild) return;

            const startMsg = await message.reply('🔄 Starting gang voice channel refresh...');
            let created = 0;
            let existing = 0;
            let errors = 0;

            const gangs = await gangInit.find({ gangStatus: true });
            
            if (gangs.length === 0) {
                return await startMsg.edit('❌ No approved gangs found.');
            }

            let category = message.guild?.channels.cache.find(
                (channel) => channel.name === client.config.gang.channel.vccategoryname && 
                channel.type === ChannelType.GuildCategory
            ) as CategoryChannel;

            if (!category) {
                category = await message.guild?.channels.create({
                    name: client.config.gang.channel.vccategoryname,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
            }

            for (const gang of gangs) {
                try {
                    let voiceChannel = gang.gangVoiceChat ? 
                        message.guild?.channels.cache.get(gang.gangVoiceChat) : null;

                    if (!voiceChannel) {

                        const gangNameConverted = convertToSpecialText(gang.gangName);
                        const prefix = client.config.gang.channel.gangvcname.split("{gang}")[0];
                        const voiceChannelName = `${prefix}${gangNameConverted}`;

                        voiceChannel = await message.guild?.channels.create({
                            name: voiceChannelName,
                            type: ChannelType.GuildVoice,
                            parent: category,
                            permissionOverwrites: [
                                {
                                    id: message.guild.id,
                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                },
                                {
                                    id: gang.gangRole,
                                    allow: [
                                        PermissionsBitField.Flags.ViewChannel,
                                        PermissionsBitField.Flags.Connect,
                                        PermissionsBitField.Flags.Speak,
                                    ],
                                },
                            ],
                        });

                        if (!voiceChannel) {
                            throw new Error('Voice channel creation failed.');
                        }

                        await gangInit.findByIdAndUpdate(gang._id, {
                            gangVoiceChat: voiceChannel.id
                        });

                        created++;
                    } else {
                        await voiceChannel.edit({
                            parent: category,
                            permissionOverwrites: [
                                {
                                    id: message.guild.id,
                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                },
                                {
                                    id: gang.gangRole,
                                    allow: [
                                        PermissionsBitField.Flags.ViewChannel,
                                        PermissionsBitField.Flags.Connect,
                                        PermissionsBitField.Flags.Speak,
                                    ],
                                },
                            ],
                        });
                        existing++;
                    }
                } catch (error) {
                    client.logger.error(`Error processing gang ${gang.gangName}:`, error);
                    errors++;
                }
            }

            const summary = [
                '📊 **Gang Voice Channel Refresh Summary**',
                `✅ Created: ${created}`,
                `⚡ Verified Existing: ${existing}`,
                `❌ Errors: ${errors}`,
                `📝 Total Gangs Processed: ${gangs.length}`
            ].join('\n');

            await startMsg.edit(summary);

        } catch (error) {
            client.logger.error('Error in refreshgangvc command:', error);
            await message.reply('❌ An error occurred while refreshing gang voice channels.');
        }
    }
}

export default command;