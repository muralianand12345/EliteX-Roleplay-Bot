const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const birthdayData = require("../../events/mongodb/modals/birthday.js");
const moment = require('moment-timezone');

module.exports = {
    cooldown: 10000,
    userPerms: [],
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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your birthday')
        ),
    async execute(interaction, client) {

        //log
        const commandName = "BIRTHDAY";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Birthday', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        //set
        if (interaction.options.getSubcommand() === "set") {

            const date = interaction.options.getInteger('date');
            const month = parseInt(interaction.options.getString('month'));

            if (date > 31 || date < 1) {
                embed.setColor('Red').setDescription(`Invalid date!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            }

            if (month === "02" && date > 29) {
                embed.setColor('Red').setDescription(`Invalid date!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            }

            if (month === "04" && date > 30 || month === "06" && date > 30 || month === "09" && date > 30 || month === "11" && date > 30) {
                embed.setColor('Red').setDescription(`Invalid date!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            }

            const birthdayMsg = `${date}/${month}`;

            const birthdayDoc = await birthdayData.findOne({
                userID: interaction.user.id
            }).catch(err => console.log(err));

            if (birthdayDoc) {
                await birthdayData.findOneAndUpdate({
                    userID: interaction.user.id
                }, {
                    $set: {
                        day: date,
                        month: month
                    }
                }).catch(err => console.log(err));
            } else {
                await birthdayData.create({
                    userID: interaction.user.id,
                    day: date,
                    month: month
                }).catch(err => console.log(err));
            }

            embed.setColor('Green').setDescription(`Your birthday has been set to ${birthdayMsg}`);
            return await interaction.editReply({
                embeds: [embed]
            });
        }

        if (interaction.options.getSubcommand() === "remove") {

            const birthdayDoc = await birthdayData.findOne({
                userID: interaction.user.id
            }).catch(err => console.log(err));

            if (!birthdayDoc) {
                embed.setColor('Red').setDescription(`You don't have a birthday set!`);
                return await interaction.editReply({
                    embeds: [embed]
                });
            } else {
                await birthdayData.findOneAndDelete({
                    userID: interaction.user.id
                }).catch(err => console.log(err));
            }

            embed.setColor('Orange').setDescription(`Your birthday has been removed!`);
            return await interaction.editReply({
                embeds: [embed]
            });
        }
    },
};