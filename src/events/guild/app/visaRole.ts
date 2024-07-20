import { Events, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, TextChannel, VoiceChannel } from 'discord.js';
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId === 'visa-application') {
            if (!interaction.guild) return;
            if (interaction.user.bot) return;

            if (!client.config.visaform.enabled) return interaction.reply({ content: 'Visa Application Form is currently disabled!', ephemeral: true });

            const visaApplicationModal = new ModalBuilder()
                .setCustomId('visa-application-modal')
                .setTitle('Iconic Visa Application Form');

            const config_form = client.config.visaform.form;

            for (const field of config_form) {
                const inputField = new TextInputBuilder()
                    .setCustomId(field.id)
                    .setLabel(field.question)
                    .setPlaceholder(field.placeholder || '')
                    .setRequired(field.required)
                    .setStyle(field.style === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph)
                    .setMinLength(field.min)
                    .setMaxLength(field.max);

                const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(inputField);
                visaApplicationModal.addComponents(actionRow);
            }

            await interaction.showModal(visaApplicationModal);
        } 
        
        if (interaction.customId === 'visa-application-modal') {
            const applicationChannel = client.channels.cache.get(client.config.visaform.channels.immigration) as TextChannel;
            
            const applicationEmbed = new EmbedBuilder()
                .setTitle('New Visa Application')
                .setColor('#0099ff')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp()
                .setFooter({ text: interaction.user.id }); 
        
            for (const field of client.config.visaform.form) {
                const answer = interaction.fields.getTextInputValue(field.id);
                applicationEmbed.addFields({ name: field.question, value: answer });
            }
        
            const acceptButton = new ButtonBuilder()
                .setCustomId('visa-application-accept')
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success);
        
            const rejectButton = new ButtonBuilder()
                .setCustomId('visa-application-reject')
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger);
        
            const actionRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(acceptButton, rejectButton);
        
            await applicationChannel.send({ embeds: [applicationEmbed], components: [actionRow] });
            await interaction.reply({ content: 'Your application has been submitted successfully!', ephemeral: true });
        }
        
        if (interaction.customId === 'visa-application-accept') {
            const userId = interaction.message.embeds[0].footer?.text;
            const user = await client.users.fetch(userId);
            if (!user) return;
        
            const notificationChannel = client.channels.cache.get(client.config.visaform.channels.accepted) as TextChannel;
        
            const Embed = new EmbedBuilder()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .setTitle('Visa Application Accepted')
                .setColor('Green')
                .setDescription('Your visa application has been accepted! Please join the waiting hall <#1264167095445360763> for voice process. You will be called in the announcement channel <#1264166369935753227> when it\'s your turn.')
                .setFooter({ text: client.user?.username || 'Iconic RP' })
                .setTimestamp();
        
            try {
                await user.send({ embeds: [Embed] });
            } catch (error) {
                client.logger.error(`Failed to send DM to user ${user.tag} | Visa Application`);
                await notificationChannel.send(`Failed to send DM to ${user.tag}. They may have DMs disabled.`);
            }
        
            await notificationChannel.send({ embeds: [Embed] });
            await interaction.update({ components: [] });
        }
        
        if (interaction.customId === 'visa-application-reject') {
            const userId = interaction.message.embeds[0].footer?.text;
            const user = await client.users.fetch(userId);
            if (!user) return;
        
            const rejectionChannel = client.channels.cache.get(client.config.visaform.channels.rejected) as TextChannel;
        
            const Embed = new EmbedBuilder()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .setTitle('Visa Application Rejected')
                .setColor('Red')
                .setDescription('We regret to inform you that your visa application has been rejected. Please review your application, ensure you have answered all questions in detail and reapply.')
                .setFooter({ text: client.user?.username || 'Iconic RP' })
                .setTimestamp();
        
            try {
                await user.send({ embeds: [Embed] });
            } catch (error) {
                client.logger.error(`Failed to send DM to user ${user.tag}| Visa Application`);
                await rejectionChannel.send(`Failed to send rejection DM to ${user.tag}. They may have DMs disabled.`);
            }
        
            await rejectionChannel.send({ embeds: [Embed] });
            await interaction.update({ components: [] });
        }
    }
};

export default event;