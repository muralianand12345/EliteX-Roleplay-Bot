const { Events } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        if (interaction.customId == 'visa-get') {

            if (interaction.user.bot) return;
            if (interaction.customId == 'visa-get') {
                if (interaction.member.roles.cache.has(client.config.visaform.visabutton.visarole)) {
                    return interaction.reply({
                        content: "You already have the Visa Holder role!",
                        ephemeral: true
                    });
                }

                await interaction.deferReply({ ephemeral: true });

                await interaction.member.roles.add(client.config.visaform.visabutton.visarole);
                await interaction.member.roles.remove(client.config.visaform.visabutton.communityrole);

                await interaction.editReply({
                    content: "You have been given the Visa Holder role!",
                    ephemeral: true
                });
            }
        }
    }
}