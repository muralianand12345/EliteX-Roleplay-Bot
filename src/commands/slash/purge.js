const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    cooldown: 10000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],

    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription("Deletes all message in a channel")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of Messages to Delete')
                .setRequired(true)),

    async execute(interaction, client) {

        const number = interaction.options.getInteger(`number`) || null;

        if (parseInt(number) > 100) {
            const replyEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setDescription('Purge message number limit (1<number>100)')
            return interaction.reply({
                embeds: [replyEmbed], ephemeral: true
            });

        } else {

            const replyEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle("Confirmation!")
                .setDescription(`\`${number} Messages Deleting\``)

            const replyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirmDeleteMsg')
                        .setLabel('CONFIRM')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancelMeleteMsg')
                        .setLabel('CANCEL')
                        .setEmoji('❎')
                        .setStyle(ButtonStyle.Danger)
                )
            msg = await interaction.reply({
                embeds: [replyEmbed],
                components: [replyButton],
                ephemeral: true
            });

            const collector = await msg.createMessageComponentCollector({
                max: "1",
                componentType: ComponentType.Button,
                time: 5000
            });

            collector.on("collect", async (i) => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId == "confirmDeleteMsg") {

                        const replyEmbed = new EmbedBuilder()
                            .setColor('#ED4245')
                            .setDescription(`\`\`\`Starting to Delete ${number} messages\`\`\``)
                        i.reply({ embeds: [replyEmbed], ephemeral: true });

                        return await i.channel.bulkDelete(number)
                            .then(async () => {
                                const replyEmbed = new EmbedBuilder()
                                    .setColor("#57F287")
                                    .setDescription(`\`\`\`${number} messages Deleted\`\`\``)
                                await i.editReply({ embeds: [replyEmbed], ephemeral: true })
                            }).catch(async (error) => {
                                if (error.code == 50034) {
                                    const replyEmbed = new EmbedBuilder()
                                        .setColor('#ED4245')
                                        .setDescription(`\`\`\`Can only delete messages that are under 14 days old\`\`\``)
                                    await i.editReply({ embeds: [replyEmbed], ephemeral: true })
                                }
                            });
                    }

                    if (i.customId == "cancelMeleteMsg") {
                        const replyEmbed = new EmbedBuilder()
                            .setColor("#57F287")
                            .setDescription(`\`\`\`Delete Stopped!\`\`\``)
                        return i.reply({ embeds: [replyEmbed], ephemeral: true });
                    }

                }
            });

            collector.on('end', collected => {

            });
        }
    }
};