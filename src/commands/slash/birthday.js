const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const birthdayData = require("../../events/database/modals/birthday.js");

module.exports = {
    cooldown: 10000,
    userPerms: [],
    owner: false,
    botPerms: ['Administrator'],

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
        ),
    async execute(interaction, client) {

        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Birthday', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        if (interaction.options.getSubcommand() === "set") {

            const date = interaction.options.getInteger('date');
            const month = parseInt(interaction.options.getString('month'));
            const year = parseInt(interaction.options.getInteger('year')) || null;
            var userAge;

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

            if (year && year > 2020 || year && year < 1950 || year && year.toString().length !== 4 ) {
                embed.setColor('Red').setDescription(`Invalid year!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            }

            if (year) {
                userAge = new Date().getFullYear() - year;
            }

            const birthdayMsg = `${date}/${month}`;

            const birthdayDoc = await birthdayData.findOne({
                userID: interaction.user.id
            }).catch(err => client.logger.error(err));

            if (birthdayDoc) {
                await birthdayData.findOneAndUpdate({
                    userID: interaction.user.id
                }, {
                    $set: {
                        day: date,
                        month: month,
                        year: year,
                        age: userAge
                    }
                }).catch(err => client.logger.error(err));
            } else {
                await birthdayData.create({
                    userID: interaction.user.id,
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

        if (interaction.options.getSubcommand() === "remove") {

            const birthdayDoc = await birthdayData.findOne({
                userID: interaction.user.id
            }).catch(err => client.logger.error(err));

            if (!birthdayDoc) {
                embed.setColor('Red').setDescription(`You don't have a birthday set!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            } else {
                await birthdayData.findOneAndDelete({
                    userID: interaction.user.id
                }).catch(err => client.logger.error(err));
            }

            embed.setColor('Orange').setDescription(`Your birthday has been removed!`);
            return await interaction.editReply({
                embeds: [embed]
            });
        }
    },
};