import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ButtonBuilder } from 'discord.js';
import birthdayModel from '../../events/database/schema/birthday';
import { SlashCommand, IBirthday } from '../../types';

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
                const monthString: string = interaction.options.getString('month') || "";
                const year: number | null = interaction.options.getInteger('year');
                if (!date || !monthString) {
                    return interaction.editReply({ content: 'Please provide all the required options' });
                }
                const month: number = parseInt(monthString);

                // Validate date, month, and year
                if (date < 1 || date > 31) {
                    embed.setColor('Red').setDescription('Invalid date!');
                    return await interaction.editReply({ embeds: [embed] });
                }

                const maxDaysInMonth = new Date(year || new Date().getFullYear(), month, 0).getDate();
                if (date > maxDaysInMonth) {
                    embed.setColor('Red').setDescription('Invalid date for the given month!');
                    return await interaction.editReply({ embeds: [embed] });
                }

                if (year && (year > new Date().getFullYear() || year < 1900)) {
                    embed.setColor('Red').setDescription('Invalid year!');
                    return await interaction.editReply({ embeds: [embed] });
                }

                let userAge: number | null = null;
                if (year) {
                    const today = new Date();
                    userAge = today.getFullYear() - year;
                    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < date)) {
                        userAge--;
                    }
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
                return await interaction.editReply({ embeds: [embed] });
            }

            case 'remove': {
                const birthdayDoc = await birthdayModel.findOne({
                    userId: interaction.user.id
                }).catch(err => client.logger.error(err));

                if (!birthdayDoc) {
                    embed.setColor('Red').setDescription('You don\'t have a birthday set!');
                    return await interaction.editReply({ embeds: [embed] });
                } else {
                    await birthdayModel.findOneAndDelete({
                        userId: interaction.user.id
                    }).catch(err => client.logger.error(err));
                }

                embed.setColor('Orange').setDescription('Your birthday has been removed!');
                return await interaction.editReply({ embeds: [embed] });
            }

            case 'display': {
                const monthDic: Record<number, string> = {
                    1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
                    7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December'
                };

                const type = interaction.options.getString('type');

                switch (type) {
                    case 'your': {
                        const birthdayDoc = await birthdayModel.findOne({
                            userId: interaction.user.id
                        }).catch(err => client.logger.error(err));

                        if (!birthdayDoc) {
                            embed.setColor('Red').setDescription('You don\'t have a birthday set!');
                            return await interaction.editReply({ embeds: [embed] });
                        }

                        if (birthdayDoc.year) {
                            embed.setColor('Green')
                                .setDescription(`Your birthday is on \`${birthdayDoc.day} ${monthDic[birthdayDoc.month]} ${birthdayDoc.year}\`\nYou are \`${new Date().getFullYear() - birthdayDoc.year}\` years old`);
                        } else {
                            embed.setColor('Green')
                                .setDescription(`Your birthday is on \`${birthdayDoc.day} ${monthDic[birthdayDoc.month]}\``);
                        }

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    case 'all': {
                        const birthdayDocs = await birthdayModel.find().catch(err => client.logger.error(err));

                        if (!birthdayDocs || birthdayDocs.length === 0) {
                            embed.setColor('Red').setDescription('No one has a birthday set!');
                            return await interaction.editReply({ embeds: [embed] });
                        }

                        const rows = new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('birthday-page-previous')
                                    .setEmoji('⬅️')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('birthday-page-next')
                                    .setEmoji('➡️')
                                    .setStyle(ButtonStyle.Secondary)
                            );

                        const fields: string[] = birthdayDocs.sort((a: IBirthday, b: IBirthday) => a.month - b.month || a.day - b.day).map((doc: IBirthday, index: number) => {
                            const age = doc.year ? ` | **Age:** \`${new Date().getFullYear() - doc.year}\`` : '';
                            return `**${index + 1}** | **User:** <@${doc.userId}> | **Birthday:** \`${doc.day} ${monthDic[doc.month]}${doc.year ? ` ${doc.year}` : ''}\`${age}`;
                        });

                        if (!fields.length) {
                            embed.setColor('Red').setDescription('No one has a birthday set!');
                            return await interaction.editReply({ embeds: [embed] });
                        }

                        embed.setColor('Green').setDescription(fields.slice(0, 25).join('\n'));

                        const msg = await interaction.editReply({ embeds: [embed], components: [rows] });

                        const collector = msg.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 25000
                        });

                        collector.on('collect', async i => {
                            if (i.user.id === interaction.user.id) {
                                if (i.customId === 'birthday-page-next') {
                                    embed.setColor('Green').setDescription(fields.slice(25, 50).join('\n'));
                                    await i.update({ embeds: [embed] });
                                }
                                if (i.customId === 'birthday-page-previous') {
                                    embed.setColor('Green').setDescription(fields.slice(0, 25).join('\n'));
                                    await i.update({ embeds: [embed] });
                                }
                            }
                        });

                        collector.on('end', async () => {
                            rows.components.forEach(component => component.setDisabled(true));
                            await msg.edit({ components: [rows] });
                        });
                    }
                }
            }
        }
    }
};

export default command;
