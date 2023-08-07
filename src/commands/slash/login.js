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

        try {
            let admin = await AdminModal.findOne({ username });
            if (!admin) {
                admin = new AdminModal({
                    username,
                    password,
                });
                await admin.save();
            } else {
                if (admin.password !== password) {
                    return interaction.reply({ content: 'Invalid admin credentials.', ephemeral: true });
                }
            }
            await interaction.reply({ content: 'Login successful! Welcome to the admin dashboard.', ephemeral: true });
        } catch (error) {
            console.error('Error during admin login:', error);
            return interaction.reply({ content: 'An error occurred during admin login. Please try again later.', ephemeral: true });
        }
    },
};
