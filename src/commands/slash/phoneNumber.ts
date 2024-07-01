import { SlashCommandBuilder, EmbedBuilder, TextChannel, Message } from "discord.js";

import { SlashCommand, IPhoneNumber } from "../../types";
import PhoneModal from "../../events/database/schema/phoneNumber";

const command: SlashCommand = {
    cooldown: 10000,
    owner: true,
    data: new SlashCommandBuilder()
        .setName('phonenumber')
        .setDescription('Request Phone Number change (Ticket)')
        .setDMPermission(false)
        .addStringOption(option => option
            .setName('type')
            .setDescription('Phone Number type')
            .setRequired(true)
            .addChoices(
                { name: 'Identical', value: 'identical' },
                { name: 'Running', value: 'running' }
            )
        ),
    async execute(interaction, client) {

        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user?.username || "Iconic Roleplay", iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        if (!interaction.guild) return interaction.reply({ content: 'This command can only be executed in a guild!' });
        const chan = interaction.channel as TextChannel;
        if (!chan) return interaction.reply({ content: "Error Occurred, try again later!" });
        if (!chan.name.includes('ticket')) return interaction.reply({ content: 'This command can only be executed in a ticket channel.' });

        await interaction.deferReply();

        const PhoneData = await PhoneModal.findOne({ userId: interaction.user.id });
        if (PhoneData) {
            embed.setColor('Red')
                .setDescription('You already have a custom phone number')
                .setFooter({ text: 'Contact developers if you think there is an issue.' });

            return interaction.editReply({ embeds: [embed] });
        }

        const type = interaction.options.getString('type');
        if (!type) return interaction.editReply({ content: 'Please select a type of phone number.' });

        const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
        await interaction.editReply({ content: 'Please provide the phone number you want to set.' }).then(async () => {
            await interaction.channel?.awaitMessages({ filter: collectorFilter, max: 1, time: 60000, errors: ['time'] })
                .then(async (collected: any) => {
                    await interaction.editReply({ content: 'Processing your request...' });

                    const phoneNumber = collected.first().content;

                    if (!phoneNumber || isNaN(Number(phoneNumber))) {
                        return await interaction.editReply({ content: 'Please provide a valid phone number!' });
                    }
                    if (phoneNumber.length < 4 || phoneNumber.length > 10) {
                        return await interaction.editReply({ content: 'Phone number must be between 4 and 10 digits.' });
                    }

                    switch (type) {
                        case 'identical':
                            const allIdentical = phoneNumber.split('').every((digit: string) => digit === phoneNumber[0]);
                            if (!allIdentical) {
                                return await interaction.editReply({ content: 'Phone number must have all identical digits for the "identical" type.' });
                            }
                            break;
                        case 'running':
                            const isAscending = phoneNumber.split('').every((digit: string, index: number, arr: string[]) => {
                                return index === 0 || (digit.charCodeAt(0) - arr[index - 1].charCodeAt(0) === 1);
                            });
                            const isDescending = phoneNumber.split('').every((digit: string, index: number, arr: string[]) => {
                                return index === 0 || (arr[index - 1].charCodeAt(0) - digit.charCodeAt(0) === 1);
                            });
                            if (!isAscending && !isDescending) {
                                return await interaction.editReply({ content: 'Phone number must be in a running sequence for the "running" type.' });
                            }
                            break;
                        default:
                            return await interaction.editReply({ content: 'Please provide a valid phone number type!' });
                    }

                    const phoneData = await PhoneModal.findOne({
                        phonenumber: Number(phoneNumber)
                    });
                    if (phoneData) {
                        return await interaction.editReply({ content: 'This phone number is already in use!' });
                    }

                    const newPhoneData: IPhoneNumber = new PhoneModal({
                        userId: interaction.user.id,
                        phonenumber: Number(phoneNumber),
                        status: true
                    });

                    await newPhoneData.save().then(async () => {
                        embed.setColor('Green')
                            .setDescription('Phone number has been successfully set!');
                        return await interaction.editReply({ content: "", embeds: [embed] });
                    }).catch(async (err) => {
                        embed.setColor('Red')
                            .setDescription('An error occurred while setting the phone number!');
                        return await interaction.editReply({ content: "", embeds: [embed] });
                    });
                })
                .catch(async (error) => {
                    if (error as Error && error.message === 'time') {
                        return await interaction.editReply({ content: 'Time expired. Please try setting your phone number again.' });
                    }
                    return await interaction.editReply({ content: 'An error occurred while processing your request.' });
                });
        });
    }
};

export default command;