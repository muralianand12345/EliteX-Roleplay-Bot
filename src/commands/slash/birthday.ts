import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ButtonBuilder } from 'discord.js';

import birthdayModel from '../../events/database/schema/birthday';
import { SlashCommand } from '../../types';

const command: SlashCommand = {
    cooldown: 10000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Birthday Command')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your birthday')
                .addIntegerOption(option => option
                    .setName('date')
                    .setDescription('Date of your birthday')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('month')
                    .setDescription('Month of your birthday')
                    .setRequired(true)
                    .addChoices(
                        { name: 'January', value: '01' },
                        { name: 'February', value: '02' },
                        { name: 'March', value: '03' },
                        { name: 'April', value: '04' },
                        { name: 'May', value: '05' },
                        { name: 'June', value: '06' },
                        { name: 'July', value: '07' },
                        { name: 'August', value: '08' },
                        { name: 'September', value: '09' },
                        { name: 'October', value: '10' },
                        { name: 'November', value: '11' },
                        { name: 'December', value: '12' }
                    )
                )
                .addIntegerOption(option => option
                    .setName('year')
                    .setDescription('Birthday Year')
                    .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your birthday')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('display')
                .setDescription('Displays all/your birthday')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('All/Your birthday')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Your', value: 'your' },
                        { name: 'All', value: 'all' }
                    )
                )
        ),
    async execute(interaction, client) {

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Birthday', iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        await interaction.deferReply();

        switch (interaction.options.getSubcommand()) {
            case 'set': {
                const date = interaction.options.getInteger('date');
                const month_string: string = interaction.options.getString('month') || "";
                const year_string: string | null = interaction.options.getString('year') || null;
                if (!date || !month_string) {
                    return interaction.editReply({ content: 'Please provide all the required options' });
                }
                const month: number = parseInt(month_string);
                const year: number | null = year_string ? parseInt(year_string) : null;
                var userAge

                if (date > 31 || date < 1) {
                    embed.setColor('Red').setDescription(`Invalid date!`);
                    return await interaction.editReply({
                        embeds: [embed]
                    });
                }

                if (month === 2 && date > 29) {
                    embed.setColor('Red').setDescription(`Invalid date!`);
                    return await interaction.editReply({
                        embeds: [embed]
                    });
                }

                if (month === 4 && date > 30 || month === 6 && date > 30 || month === 9 && date > 30 || month === 11 && date > 30) {
                    embed.setColor('Red').setDescription(`Invalid date!`);
                    return await interaction.editReply({
                        embeds: [embed]
                    });
                }

                if (year && year > 2020 || year && year < 1950 || year && year.toString().length !== 4) {
                    embed.setColor('Red').setDescription(`Invalid year!`);
                    return await interaction.editReply({
                        embeds: [embed]
                    });
                }

                if (year) {
                    userAge = new Date().getFullYear() - year;
                }

                const birthdayMsg = `${date}/${month}`;

                const birthdayDoc = await birthdayModel.findOne({
                    userId: interaction.user.id
                }).catch(err => client.logger.error(err));

                if (birthdayDoc) {
                    await birthdayModel.findOneAndUpdate({
                        userId: interaction.user.id
                    }, {
                        $set: {
                            day: date,
                            month: month,
                            year: year,
                            age: userAge
                        }
                    }).catch(err => client.logger.error(err));
                } else {
                    await birthdayModel.create({
                        userId: interaction.user.id,
                        day: date,
                        month: month,
                        year: year,
                        age: userAge
                    }).catch(err => client.logger.error(err));
                }

                embed.setColor('Green').setDescription(`Your birthday has been set to ${birthdayMsg}`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            }

            case "remove": {
                const birthdayDoc = await birthdayModel.findOne({
                    userId: interaction.user.id
                }).catch(err => client.logger.error(err));

                if (!birthdayDoc) {
                    embed.setColor('Red').setDescription(`You don't have a birthday set!`);
                    return await interaction.editReply({
                        embeds: [embed]
                    });
                } else {
                    await birthdayModel.findOneAndDelete({
                        userId: interaction.user.id
                    }).catch(err => client.logger.error(err));
                }

                embed.setColor('Orange').setDescription(`Your birthday has been removed!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            }

            case "display": {
                const monthDic: any = {
                    1: "January",
                    2: "February",
                    3: "March",
                    4: "April",
                    5: "May",
                    6: "June",
                    7: "July",
                    8: "August",
                    9: "September",
                    10: "October",
                    11: "November",
                    12: "December"
                };

                const type = interaction.options.getString('type');

                switch (type) {
                    case "your": {
                        const birthdayDoc = await birthdayModel.findOne({
                            userId: interaction.user.id
                        }).catch(err => client.logger.error(err));

                        if (!birthdayDoc) {
                            embed.setColor('Red').setDescription(`You don't have a birthday set!`);
                            return await interaction.editReply({
                                embeds: [embed]
                            });
                        }

                        if (birthdayDoc.year) {
                            embed.setColor('Green')
                                .setDescription(`Your birthday is on \`${birthdayDoc.day} ${monthDic[birthdayDoc.month]} ${birthdayDoc.year}\`\nYou are \`${new Date().getFullYear() - birthdayDoc.year}\` years old`);
                        } else {
                            embed.setColor('Green')
                                .setDescription(`Your birthday is on \`${birthdayDoc.day} ${monthDic[birthdayDoc.month]}\``);
                        }

                        return await interaction.editReply({
                            embeds: [embed]
                        });
                    }

                    case "all": {
                        const birthdayDoc = await birthdayModel.find().catch((err: Error) => client.logger.error(err));

                        if (!birthdayDoc) {
                            embed.setColor('Red').setDescription(`No one has a birthday set!`);
                            return await interaction.editReply({
                                embeds: [embed]
                            });
                        }

                        var row = new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('birthday-page-previous')
                                    .setEmoji('⬅️')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('birthday-page-next')
                                    .setEmoji('➡️')
                                    .setStyle(ButtonStyle.Secondary)
                            )

                        var field: any = [];

                        birthdayDoc.sort((a: any, b: any) => a.month - b.month || a.day - b.day).forEach((doc: any, index: number) => {
                            if (doc.year) {
                                field.push(`**${index + 1}** | **User:** <@${doc.userId}> | **Birthday:** \`${doc.day} ${monthDic[doc.month]} ${doc.year}\` | **Age:** \`${new Date().getFullYear() - doc.year}\``);
                            } else {
                                field.push(`**${index + 1}** | **User:** <@${doc.userId}> | **Birthday:** \`${doc.day} ${monthDic[doc.month]}\``);
                            }
                        });

                        if (!field.length) {
                            embed.setColor('Red').setDescription(`No one has a birthday set!`);
                            return await interaction.editReply({
                                embeds: [embed]
                            });
                        }

                        embed.setColor('Green').setDescription(field.slice(0, 25).join('\n'));

                        const msg = await interaction.editReply({
                            embeds: [embed],
                            components: [row]
                        });

                        const collector = await msg.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 25000
                        });

                        collector.on("collect", async (i) => {
                            if (i.user.id === interaction.user.id) {
                                if (i.customId == "birthday-page-next") {
                                    embed.setColor('Green').setDescription(field.slice(25, 50).join('\n'));
                                    await i.update({ embeds: [embed] });
                                }
                                if (i.customId == "birthday-page-previous") {
                                    embed.setColor('Green').setDescription(field.slice(0, 25).join('\n'));
                                    await i.update({ embeds: [embed] });
                                }
                            }
                        });

                        collector.on("end", async () => {
                            row = new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('birthday-page-previous')
                                        .setEmoji('⬅️')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('birthday-page-next')
                                        .setEmoji('➡️')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true)
                                )
                            await msg.edit({ components: [row] });
                        });
                    }
                }
            }
        }
    }
}

export default command;