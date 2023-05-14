//Required
const {
    Events,
    ComponentType,
    ChannelType,
    PermissionFlagsBits
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
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const vpModel = require('../../events/models/vpuser.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        /*var vpLogEmbed = new EmbedBuilder()
            .setColor('Green')

        if (interaction.customId == "vp-button") {

            //Model 1
            const form1 = new ModalBuilder()
                .setCustomId('vp-form1')
                .setTitle('Introduction');

            const RealName = new TextInputBuilder()
                .setCustomId('vp-name')
                .setLabel('What is your real life name')
                .setStyle(TextInputStyle.Short);

            const Email = new TextInputBuilder()
                .setCustomId('vp-email')
                .setLabel('What is your E-Mail?')
                .setStyle(TextInputStyle.Short);

            const IcName = new TextInputBuilder()
                .setCustomId('vp-icname')
                .setLabel('What is your IC name?')
                .setPlaceholder('Realistic names only allowed!')
                .setStyle(TextInputStyle.Short);

            const SteamLink = new TextInputBuilder()
                .setCustomId('vp-steam')
                .setLabel('Your Steam profile link')
                .setPlaceholder('Steam > Profile > Right Click > Copy URL')
                .setStyle(TextInputStyle.Short);

            const HowLongRP = new TextInputBuilder()
                .setCustomId('vp-howlong')
                .setLabel('How long have you been playing roleplay?')
                .setStyle(TextInputStyle.Short);

            const firstActionRow = new ActionRowBuilder().addComponents(RealName);
            const secondActionRow = new ActionRowBuilder().addComponents(Email);
            const thirdActionRow = new ActionRowBuilder().addComponents(IcName);
            const fourthActionRow = new ActionRowBuilder().addComponents(SteamLink);
            const fivthActionRow = new ActionRowBuilder().addComponents(HowLongRP);

            form1.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivthActionRow);
            await interaction.showModal(form1);
        }

        if (interaction.customId === 'vp-form1') {

            const VpName = interaction.fields.getTextInputValue('vp-name');
            const VpEmail = interaction.fields.getTextInputValue('vp-email');
            const VpICName = interaction.fields.getTextInputValue('vp-icname');
            const VpSteam = interaction.fields.getTextInputValue('vp-steam');
            const VpHowlong = interaction.fields.getTextInputValue('vp-howlong');

            vpLogEmbed.addFields(
                { name: 'Name', value: `${VpName}` },
                { name: 'Email', value: `${VpEmail}` },
                { name: 'IC Name', value: `${VpICName}` },
                { name: 'Steam URL', value: `${VpSteam}` },
                { name: 'How Long RP', value: `${VpHowlong}` },
            )

            const reply1 = new EmbedBuilder()
                .setDescription('```Click The Button For Next Questions```')
            const but1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('vp-button2')
                        .setLabel('Continue')
                        .setStyle(ButtonStyle.Success),
                );

            const msg1 = await interaction.reply({ embeds: [reply1], components: [but1], ephemeral: true });

            const collector = await msg1.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000,
                max: 1
            });

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {

                    if (i.customId === 'vp-button2') {

                        //Model 2
                        const form2 = new ModalBuilder()
                            .setCustomId('vp-form2')
                            .setTitle('Basic Questions');

                        const Roleplay = new TextInputBuilder()
                            .setCustomId('vp-roleplay')
                            .setLabel('What is Roleplay? Explain Briefly.')
                            .setStyle(TextInputStyle.Paragraph);

                        const FailRP = new TextInputBuilder()
                            .setCustomId('vp-fail')
                            .setLabel('Explain Fail RP with a example.')
                            .setStyle(TextInputStyle.Paragraph);

                        const FearRP = new TextInputBuilder()
                            .setCustomId('vp-fear')
                            .setLabel('Explain Fear Gaming with a situation.')
                            .setStyle(TextInputStyle.Paragraph);

                        const RdmVdm = new TextInputBuilder()
                            .setCustomId('vp-rdmvdm')
                            .setLabel('Explain RDM & VDM with Example.')
                            .setStyle(TextInputStyle.Paragraph);

                        const PowerGaming = new TextInputBuilder()
                            .setCustomId('vp-powergaming')
                            .setLabel('Explain Power Gaming with a situation.')
                            .setStyle(TextInputStyle.Paragraph);

                        const firstActionRow = new ActionRowBuilder().addComponents(Roleplay);
                        const secondActionRow = new ActionRowBuilder().addComponents(FailRP);
                        const thirdActionRow = new ActionRowBuilder().addComponents(FearRP);
                        const fourthActionRow = new ActionRowBuilder().addComponents(RdmVdm);
                        const fivthActionRow = new ActionRowBuilder().addComponents(PowerGaming);

                        form2.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivthActionRow);
                        await i.showModal(form2);

                        //await interaction.reply({ content: 'Your submission was received successfully!', ephemeral: true });
                    }
                }
            });
        }
        if (interaction.customId === 'vp-form2') {

            const VpRoleplay = interaction.fields.getTextInputValue('vp-roleplay');
            const VpFailRP = interaction.fields.getTextInputValue('vp-fail');
            const VpFearRP = interaction.fields.getTextInputValue('vp-fear');
            const VpRdmVdm = interaction.fields.getTextInputValue('vp-rdmvdm');
            const VpPG = interaction.fields.getTextInputValue('vp-powergaming');

            vpLogEmbed.addFields(
                { name: 'What is Roleplay', value: `${VpRoleplay}` },
                { name: 'What is FailRP', value: `${VpFailRP}` },
                { name: 'What is FearRP', value: `${VpFearRP}` },
                { name: 'What is RDM & VDM', value: `${VpRdmVdm}` },
                { name: 'What is PowerGaming', value: `${VpPG}` },
            )

            await client.channels.cache.get('1099375862534635520').send({
                embeds: [vpLogEmbed]
            });

            await interaction.reply({ content: 'Your submission was received successfully!', ephemeral: true });

        }*/

        if (interaction.customId == "vp-button") {

            var vpChannel = await interaction.guild.channels.create({
                name: `vp-${interaction.user.username}`,
                parent: '1064233291240185866',
                topic: 'Voice Process',
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: '1058684219041255504',
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                ],
                type: ChannelType.GuildText,
            }).then(async c=>{
                await interaction.reply({ 
                    content: `Voice Process Form Created! <#${c.id}>`,
                    ephemeral: true
                });

                msg = await c.send({
                    content: `This Application is only avaiable for 10 Minutes! Kindly finish within time.`,
                });
            });

            /*var vpData = await vpModel.findOne({
                userID: interaction.user.id
            }).catch(err => console.log(err));

            if (vpData) {
                await interaction.reply({
                    content: 'You have already applied, contact immigration officer!',
                    ephemeral: true
                });
            } else {

                const form1 = new ModalBuilder()
                    .setCustomId('vp-form1')
                    .setTitle('Introduction');

                const RealName = new TextInputBuilder()
                    .setCustomId('vp-name')
                    .setLabel('What is your real life name')
                    .setStyle(TextInputStyle.Short);

                const Email = new TextInputBuilder()
                    .setCustomId('vp-email')
                    .setLabel('What is your E-Mail?')
                    .setStyle(TextInputStyle.Short);

                const IcName = new TextInputBuilder()
                    .setCustomId('vp-icname')
                    .setLabel('What is your IC name?')
                    .setPlaceholder('Realistic names only allowed!')
                    .setStyle(TextInputStyle.Short);

                const SteamLink = new TextInputBuilder()
                    .setCustomId('vp-steam')
                    .setLabel('Your Steam profile link')
                    .setPlaceholder('Steam > Profile > Right Click > Copy URL')
                    .setStyle(TextInputStyle.Short);

                const HowLongRP = new TextInputBuilder()
                    .setCustomId('vp-howlong')
                    .setLabel('How long have you been playing roleplay?')
                    .setStyle(TextInputStyle.Short);

                const firstActionRow = new ActionRowBuilder().addComponents(RealName);
                const secondActionRow = new ActionRowBuilder().addComponents(Email);
                const thirdActionRow = new ActionRowBuilder().addComponents(IcName);
                const fourthActionRow = new ActionRowBuilder().addComponents(SteamLink);
                const fivthActionRow = new ActionRowBuilder().addComponents(HowLongRP);

                form1.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivthActionRow);
                await interaction.showModal(form1);
            }*/
        }

        if (interaction.customId == "vp-form1") {



        }
    }
}