const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AdminModal = require('../../events/mongodb/modals/adminLogin.js');

module.exports = {
    cooldown: 10000,
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription("Admin Login")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter your admin username')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Enter your admin password')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');

        if (password.length < 8) {
            return interaction.reply({ content: '**Error:** Password must be at least 8 characters', ephemeral: true });
        } else if (password.search(/[A-Z]/) < 0) {
            return interaction.reply({ content: '**Error:** Password must contain at least one lowercase letter', ephemeral: true });
        } else if (password.search(/[a-z]/) < 0) {
            return interaction.reply({ content: '**Error:** Password must contain at least one uppercase letter', ephemeral: true });
        } else if (password.search(/[0-9]/) < 0) {
            return interaction.reply({ content: '**Error:** Password must contain at least one number', ephemeral: true });
        } else if (password == username) {
            return interaction.reply({ content: '**Error:** Password and Username cannot be same!', ephemeral: true });
        } else {
            try {
                await interaction.deferReply({ ephemeral: true });

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
        }
    },
};
