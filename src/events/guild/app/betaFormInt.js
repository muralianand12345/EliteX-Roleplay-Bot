const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Collection,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId === "apply-open-beta") {

            if (cooldown.has(interaction.user.id)) {
                const cooldownTime = cooldown.get(interaction.user.id);
                const remainingTime = cooldownTime - Date.now();
                const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
                const remainingHours = Math.floor(remainingMinutes / 60);
                const minutesRemainder = remainingMinutes % 60;

                if (remainingTime <= 0) {
                    cooldown.delete(interaction.user.id);
                } else if (remainingHours >= 1) {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingHours} hour(s) and ${minutesRemainder} minute(s).`, ephemeral: true });
                } else {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingMinutes} minute(s).`, ephemeral: true });
                }
            } else {

                if (interaction.user.bot) return;
                if (!client.config.betatester.enabled) return interaction.reply({ content: 'Open Beta is disabled for now!', ephemeral: true });

                const betaFormModal = new ModalBuilder()
                    .setCustomId('beta-form-modal')
                    .setTitle(`${interaction.user.username} Beta Tester Application`);

                const betaFormTextEmail = new TextInputBuilder()
                    .setCustomId('beta-form-email')
                    .setLabel('Your Email')
                    .setPlaceholder('youremail@email.com')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(5);

                const betaFormTextRPRxp = new TextInputBuilder()
                    .setCustomId('beta-form-rp')
                    .setLabel('Your Roleplay Experience')
                    .setPlaceholder('How long have you been roleplaying?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const betaFormTextRSID = new TextInputBuilder()
                    .setCustomId('beta-form-rsid')
                    .setLabel('Your Rockstar ID/Name')
                    .setPlaceholder('Your Rockstar ID or Name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const betaFormTextPerDay = new TextInputBuilder()
                    .setCustomId('beta-form-perday')
                    .setLabel('Testing Hours per Day')
                    .setPlaceholder('How many hours can you test per day?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const betaFormTextTOS = new TextInputBuilder()
                    .setCustomId('beta-form-tos')
                    .setLabel('Agree to Iconic Roleplay TOS')
                    .setPlaceholder('Yes/No')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);


                const firstRow = new ActionRowBuilder().addComponents(betaFormTextEmail);
                const secondRow = new ActionRowBuilder().addComponents(betaFormTextRPRxp);
                const thirdRow = new ActionRowBuilder().addComponents(betaFormTextRSID);
                const fourthRow = new ActionRowBuilder().addComponents(betaFormTextPerDay);
                const fifthRow = new ActionRowBuilder().addComponents(betaFormTextTOS);

                betaFormModal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

                await interaction.showModal(betaFormModal);

                const cooldownDuration = 43200000 / 3;
                cooldown.set(interaction.user.id, Date.now() + cooldownDuration);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, cooldownDuration);
            }
        }

        if (interaction.customId === "beta-form-modal") {

            await interaction.deferReply({ ephemeral: true });

            const channel = client.channels.cache.get(client.config.betatester.channel);

            const email = interaction.fields.getTextInputValue('beta-form-email') || 'No email provided';
            const rpExp = interaction.fields.getTextInputValue('beta-form-rp') || 'No RP experience provided';
            const rsid = interaction.fields.getTextInputValue('beta-form-rsid') || 'No RSID provided';
            const perDay = interaction.fields.getTextInputValue('beta-form-perday') || 'No hours per day provided';
            const tos = interaction.fields.getTextInputValue('beta-form-tos') || 'No TOS agreement provided';

            const user = interaction.user;

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setThumbnail(client.user.displayAvatarURL())
                .setAuthor({ name: `${user.username}#${user.discriminator}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**Email**: ${email}\n**RP Experience**: ${rpExp}\n**Rockstar ID**: ${rsid}\n**Hours per day**: ${perDay}\n**TOS Agreement**: ${tos}`)
                .setFooter({ text: `ID: ${user.id}` })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept-beta-form')
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('reject-beta-form')
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger),
                );

            await channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.editReply({ content: 'Beta Tester application submitted!', ephemeral: true });

        }

        if (interaction.customId === "accept-beta-form") {

            await interaction.deferReply({ ephemeral: true });

            const user = interaction.message.embeds[0].footer.text.split('ID: ')[1];
            const member = await interaction.guild.members.fetch(user);

            await member.roles.add(client.config.betatester.role);

            await member.send({ content: `Congratulations! Your Beta Tester application has been accepted!` });
            await interaction.editReply({ content: 'Beta Tester application accepted!', ephemeral: true });

            return interaction.message.edit({ components: [] });
        }

        if (interaction.customId === "reject-beta-form") {

            await interaction.deferReply({ ephemeral: true });

            const user = interaction.message.embeds[0].footer.text.split('ID: ')[1];
            const member = await interaction.guild.members.fetch(user);

            await member.send({ content: `Sorry! Your Beta Tester application has been rejected!` });
            await interaction.editReply({ content: 'Beta Tester application rejected!', ephemeral: true });

            return interaction.message.edit({ components: [] });
        }
    }
}