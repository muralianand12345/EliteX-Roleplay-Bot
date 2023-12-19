const {
    ComponentType,
    Events,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

const modmailUserModal = require('../../database/modals/modmailUser.js');
const cooldown = new Collection();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (!client.config.modmail.enabled) return;
        if (message.guild) return;
        if (message.author.bot) return;
       
        const modMailData = await modmailUserModal.findOne({
            userID: message.author.id
        });

        if (!modMailData) {
            var modmail = new modmailUserModal({
                userID: message.author.id,
                status: false,
                threadID: null,
                count: 0
            });
            await modmail.save();
            return embedSend(message);
        }

        if (modMailData.status == false) return embedSend(message);

        async function embedSend(message) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: "Iconic RP ModMail" })
                .setDescription(`Hello <@${message.author.id}>! Click the below button to contact the staff members.\nYou can use this to ask doubts and questions (For reporting players kindly use the ticket system)`)
                .setFooter({ text: 'Click the button to get started!' });
            var button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('modmail-start')
                        .setEmoji('🎫')
                        .setLabel('Open ModMail')
                        .setStyle(ButtonStyle.Danger)
                );
            const targetGuild = client.guilds.cache.get(client.config.modmail.server);
            if (!targetGuild.members.cache.has(message.author.id)) {
                button.addComponents(
                    new ButtonBuilder()
                        .setURL(client.config.modmail.serverInvite)
                        .setLabel('Join Server')
                        .setStyle(ButtonStyle.Link)
                )
            }

            msg = await message.reply({ embeds: [embed], components: [button] });
            const collector = await msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id === message.author.id) {

                    if (cooldown.has(message.author.id)) {
                        const cooldownTime = cooldown.get(message.author.id);
                        const remainingTime = cooldownTime - Date.now();
                        const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
                        const remainingHours = Math.floor(remainingMinutes / 60);
                        const minutesRemainder = remainingMinutes % 60;

                        if (remainingTime <= 0) {
                            cooldown.delete(message.author.id);
                        } else if (remainingHours >= 1) {
                            return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingHours} hour(s) and ${minutesRemainder} minute(s) before using this ModMail again.`, ephemeral: true });
                        } else {
                            return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingMinutes} minute(s) before using this ModMail again.`, ephemeral: true });
                        }
                    } else {
                        const modmailmodal = new ModalBuilder()
                            .setCustomId('modmail-modal')
                            .setTitle('Iconic RP ModMail');

                        const Title = new TextInputBuilder()
                            .setCustomId('modmail-modal-title')
                            .setPlaceholder('e.g. "How to connect the server"')
                            .setLabel('Give your request a title')
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short);

                        const Description = new TextInputBuilder()
                            .setCustomId('modmail-modal-description')
                            .setLabel('What is your inquiry about?')
                            .setPlaceholder('Explain your issue in detail')
                            .setMaxLength(3000)
                            .setMinLength(20)
                            .setRequired(true)
                            .setStyle(TextInputStyle.Paragraph);

                        const firstActionRow = new ActionRowBuilder().addComponents(Title);
                        const secondActionRow = new ActionRowBuilder().addComponents(Description);
                        modmailmodal.addComponents(firstActionRow, secondActionRow);
                        await interaction.showModal(modmailmodal);

                        const cooldownDuration = 1800000 * 3; //30 minutes
                        cooldown.set(message.author.id, Date.now() + cooldownDuration);
                        setTimeout(() => {
                            cooldown.delete(message.author.id);
                        }, cooldownDuration);
                    }
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size < 1) {
                    await msg.edit({
                        content: 'Modmail has timed out!',
                        embeds: [],
                        components: []
                    });
                }
            });
        }
    }
}