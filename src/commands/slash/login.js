const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Collector } = require('discord.js');
const AdminModal = require('../../events/mongodb/modals/adminLogin.js'); // Replace with the path to your MongoDB admin credentials modal

module.exports = {
    cooldown: 10000,

    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription("Admin Login")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter your admin username')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Enter your admin password')
                .setRequired(true)
        ), // Set default permission to false to restrict public access

    async execute(interaction, client) {
        // Retrieve the username and password from the interaction
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');

        await interaction.deferReply({ ephemeral: true });

        try {
            const user = interaction.user;
            let admin = await AdminModal.findOne({ discordId: user.id });
            if (!admin) {
                admin = new AdminModal({
                    username,
                    password,
                });
                admin.discordId = user.id;
                admin.discordUsername = user.username;
                admin.discordAvatar = user.avatar;
                await admin.save();
                return await interaction.editReply({ content: 'Account registered successfully!', ephemeral: true });
            } else {
                return await interaction.editReply({ content: 'Already registered!', ephemeral: true });
            }

        } catch (error) {
            console.error('Error during admin login:', error);
            return await interaction.editReply({ content: 'An error occurred during admin login. Please try again later.', ephemeral: true });
        }
    },
};
