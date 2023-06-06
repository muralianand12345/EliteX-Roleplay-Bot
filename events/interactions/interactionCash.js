const {
    Events,
    Collection
} = require('discord.js');
//Modals
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
//Embed and Buttons
const {
    EmbedBuilder,
    ActionRowBuilder
} = require("discord.js");

const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var CrashEmbed = new EmbedBuilder();

        if (interaction.customId == "crashre-button") {

            if (cooldown.has(interaction.user.id)) {
                return interaction.reply({ content: `You are on a cooldown!`, ephemeral: true });
            } else {

                const crashModal = new ModalBuilder()
                    .setCustomId('crash-modal')
                    .setTitle('Crash Report Form');

                const IcName = new TextInputBuilder()
                    .setCustomId('crash-icname')
                    .setLabel('What is your Name?')
                    .setMaxLength(30)
                    .setMinLength(3)
                    .setStyle(TextInputStyle.Short);

                const crashRe = new TextInputBuilder()
                    .setCustomId('crash-content')
                    .setLabel('Explain')
                    .setMaxLength(1000)
                    .setMinLength(20)
                    .setStyle(TextInputStyle.Paragraph);


                const firstActionRow = new ActionRowBuilder().addComponents(IcName);
                const secondActionRow = new ActionRowBuilder().addComponents(crashRe);

                crashModal.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(crashModal);

                cooldown.set(interaction.user.id);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, client.feedback.TIME);
            }
        }

        /*if (interaction.customId == "crash-modal") {

            const FBIcName = interaction.fields.getTextInputValue('crash-icname');
            const FBContent = interaction.fields.getTextInputValue('crash-content');

            CrashEmbed.setColor('Red')
                .setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Name', value: `${FBIcName}` },
                    { name: 'Report', value: `${FBContent}` },
                );

            await client.channels.cache.get('1104826973483700226').send({
                embeds: [CrashEmbed]
            }).then(async (msg) => {
                return interaction.reply({ content: 'Your Crash Report recieved successfully!', ephemeral: true });
            });
        }*/
    }
}