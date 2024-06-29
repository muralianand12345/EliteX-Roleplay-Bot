import { SlashCommandBuilder, EmbedBuilder, TextChannel } from "discord.js";

import { SlashCommand, IPhoneNumber } from "../../types";
import PhoneModal from "../../events/database/schema/phoneNumber";

const command: SlashCommand = {
    cooldown: 10000,
    owner: false,
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

        await interaction.editReply({ content: 'Under Development' });

    }
};

export default command;