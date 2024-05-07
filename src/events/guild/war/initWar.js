const {
    Events,
    ComponentType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    ButtonStyle
} = require('discord.js');

const tileWarModal = require('../../database/modals/tileWar.js');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        if (interaction.customId === "war-init") {

            if (!client.config.dark.war.enabled) return interaction.reply({ content: `${interaction.guild.name}'s War system is currently disabled!`, ephemeral: true });

            await interaction.deferReply({ ephemeral: true });

            /*const currentTime = new Date();
            const currentHour = currentTime.getHours();
            if (currentHour < 12 || currentHour >= 24) {
                return interaction.editReply({ content: 'War requests can only be made between 12:00 PM to 12:00 AM!', ephemeral: true });
            }*/

            const gangList = client.config.dark.war.gangs;
            const gangLeader = client.config.dark.war.gangLeader;

            const userIsGangLeader = interaction.member.roles.cache.some(role => gangLeader.includes(role.id));

            if (!userIsGangLeader) {
                return interaction.editReply({ content: 'You are not a leader of any gang!', ephemeral: true });
            }

            const userGangRoleId = gangList.find(roleId => interaction.member.roles.cache.has(roleId));
            const userGangRole = interaction.guild.roles.cache.get(userGangRoleId);

            if (!userGangRole) {
                return interaction.editReply({ content: 'You are a leader of a gang, but your gang role was not found!', ephemeral: true });
            }

            const gangRoles = [];
            interaction.guild.roles.cache.forEach(role => {
                if (gangList.includes(role.id) && role.id !== userGangRole.id) {
                    gangRoles.push(role.name);
                }
            });

            if (gangRoles.length === 0) {
                return interaction.editReply({ content: 'No other gang roles were found!', ephemeral: true });
            }

            var tileWar = await tileWarModal.findOne({ guildID: interaction.guild.id });

            if (!tileWar) {
                tileWar = new tileWarModal({
                    guildID: interaction.guild.id,
                    currenlyWar: [],
                    count: []
                });
                await tileWar.save();
            }

            const currentlyInWar = tileWar.currenlyWar.map(data => [data.gang1.toLowerCase(), data.gang2.toLowerCase()]).flat();
            if (currentlyInWar.includes(userGangRole.name.toLowerCase())) {
                return interaction.editReply({ content: 'Your gang is already in a war!', ephemeral: true });
            }

            // Filter Gangs that are not in war
            const filteredGangs = gangRoles.filter(gang => !currentlyInWar.includes(gang.toLowerCase()));
            if (filteredGangs.length === 0) {
                return interaction.editReply({ content: 'There are no gangs available to initiate a war!', ephemeral: true });
            }

            const gangOptions = filteredGangs.map(gang => ({ label: gang, value: gang.toLowerCase() }));

            const gangRow = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('war-category')
                        .setPlaceholder('Select gang you want to war with')
                        .addOptions(gangOptions),
                );

            msg = await interaction.editReply({
                content: 'Select the gang you want to war with',
                components: [gangRow],
                ephemeral: true
            });

            const collector = await msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 30000
            });

            var gangOponent, gangWarDate, gangWarTime;

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {
                    await i.deferReply({ ephemeral: true });
                    if (i.values[0]) {

                        gangOponent = i.values[0];
                        gangOponent = gangOponent.charAt(0).toUpperCase() + gangOponent.slice(1);

                        const today = new Date();
                        today.setDate(today.getDate() + 3);

                        const stringMenuOptions = [];
                        for (let i = 0; i < 7; i++) {
                            const date = today.getDate();
                            const month = months[today.getMonth()];
                            const dateString = `${date}${getDaySuffix(date)} ${month}`;
                            const dateInWar = tileWar.currenlyWar.find(data => data.warDate.toLowerCase() === dateString.toLowerCase());

                            if (!dateInWar) {
                                stringMenuOptions.push({ label: dateString, value: dateString.toLowerCase() });
                                today.setDate(today.getDate() + 1);
                            } else {
                                today.setDate(today.getDate() + 1);
                            }
                        }

                        if (stringMenuOptions.length === 0) {
                            return i.editReply({
                                content: 'There are no available dates for war!',
                                components: [],
                                ephemeral: true
                            });
                        }

                        const dateRow = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('war-date')
                                    .setPlaceholder('Select war date')
                                    .addOptions(stringMenuOptions),
                            );

                        datemsg = await i.editReply({
                            content: 'Select the date for the war',
                            components: [dateRow],
                            ephemeral: true
                        });

                        const dateCollector = await datemsg.createMessageComponentCollector({
                            componentType: ComponentType.StringSelect,
                            time: 30000
                        });

                        dateCollector.on('collect', async i2 => {
                            if (i2.user.id === interaction.user.id) {
                                await i2.deferReply({ ephemeral: true });
                                if (i2.values[0]) {

                                    gangWarDate = i2.values[0];

                                    const selectedDate = i2.values[0];
                                    const selectedDateArray = selectedDate.split(' ');
                                    const selectedDay = parseInt(selectedDateArray[0], 10);
                                    const selectedMonth = selectedDateArray[1];

                                    const currentYear = new Date().getFullYear();
                                    const selectedDateObj = new Date(`${selectedMonth} ${selectedDay}, ${currentYear}`);
                                    const selectedDayIndex = selectedDateObj.getDay();

                                    let timingOptions;

                                    if (selectedDayIndex === 0 || selectedDayIndex === 6) {
                                        const weekendTiming = client.config.dark.war.timeOptions.weekend;
                                        timingOptions = weekendTiming.map(time => ({
                                            label: time.label,
                                            value: time.label,
                                            emoji: time.emoji
                                        }));
                                    } else {
                                        const weekdayTiming = client.config.dark.war.timeOptions.weekdays;
                                        timingOptions = weekdayTiming.map(time => ({
                                            label: time.label,
                                            value: time.label,
                                            emoji: time.emoji
                                        }));
                                    }

                                    const checkTimingDB = timingOptions.map(time => time.label);
                                    const checkTimingDB2 = tileWar.currenlyWar.filter(data => checkTimingDB.includes(data.timing));

                                    if (checkTimingDB2.length > 0) {
                                        const checkTimingDB3 = checkTimingDB2.map(data => data.timing);
                                        const checkTimingDB4 = timingOptions.filter(time => !checkTimingDB3.includes(time.label));

                                        if (checkTimingDB4.length === 0) {
                                            return i2.editReply({
                                                content: 'All the timings for the selected date are already taken!',
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            timingOptions = checkTimingDB4;
                                        }
                                    }

                                    if (timingOptions.length === 0) {
                                        return i2.editReply({
                                            content: 'There are no available timings for the selected date!',
                                            components: [],
                                            ephemeral: true
                                        });
                                    }

                                    var timingRow = new ActionRowBuilder()
                                        .addComponents(
                                            new StringSelectMenuBuilder()
                                                .setCustomId('war-timing')
                                                .setPlaceholder('Select war timing')
                                                .addOptions(timingOptions),
                                        );

                                    timingmsg = await i2.editReply({
                                        content: 'Select the timing for the war',
                                        components: [timingRow],
                                        ephemeral: true
                                    });

                                    const timingCollector = await timingmsg.createMessageComponentCollector({
                                        componentType: ComponentType.StringSelect,
                                        time: 30000
                                    });

                                    timingCollector.on('collect', async i3 => {
                                        if (i3.user.id === interaction.user.id) {
                                            await i3.deferReply({ ephemeral: true });
                                            if (i3.values[0]) {

                                                gangWarTime = i3.values[0];

                                                await i3.editReply({
                                                    content: 'Waiting for the opponent to acknowledge the war request!',
                                                    components: [],
                                                    ephemeral: true
                                                });

                                                const reqOppEmbed = new EmbedBuilder()
                                                    .setTitle('War Request')
                                                    .setDescription(`${userGangRole.name} has requested a war with ${gangOponent} at ${gangWarDate} (${gangWarTime})`)
                                                    .setColor('Red')
                                                    .setFooter({ text: `Requesting ${gangOponent} to acknowledge this message and press the button before 24hrs.` });

                                                const reqOppRow = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder()
                                                            .setCustomId('war-req-ack-agree')
                                                            .setLabel('Agree War Request')
                                                            .setStyle(ButtonStyle.Primary),
                                                        new ButtonBuilder()
                                                            .setCustomId('war-req-ack-disagree')
                                                            .setLabel('Disagree War Request')
                                                            .setStyle(ButtonStyle.Secondary),
                                                    );

                                                const gangOponentRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === gangOponent.toLowerCase());

                                                if (!gangOponentRole) {
                                                    return i3.editReply({
                                                        content: 'The gang role was not found!',
                                                        components: [],
                                                        ephemeral: true
                                                    });
                                                }
                                                const reqOppChannel = client.channels.cache.get(client.config.dark.war.reqchannelid);
                                                reqoppMsg = await reqOppChannel.send({
                                                    content: `<@&${gangOponentRole.id}>`,
                                                    embeds: [reqOppEmbed],
                                                    components: [reqOppRow]
                                                });

                                                tileWar.currenlyWar.push({ gang1: userGangRole.name, gang2: gangOponent, pannelID: "Still Pending", requestPannelID: reqoppMsg.id, waractive: false, warDate: gangWarDate, timing: gangWarTime });
                                                await tileWar.save();

                                                timingCollector.stop();
                                            }
                                        }
                                    });

                                    timingCollector.on('end', async collected => {
                                        if (collected.size < 1) {
                                            await i2.editReply({
                                                content: 'You did not choose a timing for the war!',
                                                components: [],
                                                ephemeral: true
                                            });
                                        }
                                    });
                                    dateCollector.stop();
                                }
                            }
                        });

                        dateCollector.on('end', async collected => {
                            if (collected.size < 1) {
                                await i.editReply({
                                    content: 'You did not choose a date for the war!',
                                    components: [],
                                    ephemeral: true
                                });
                            }
                        });
                    }
                }
                collector.stop();
            });

            collector.on('end', async collected => {
                if (collected.size < 1) {
                    await interaction.editReply({
                        content: 'You did not choose a gang to war with!',
                        components: [],
                        ephemeral: true
                    });
                }
            });
        }

        if (interaction.customId.includes("war-req-ack")) {

            await interaction.deferReply({ ephemeral: true });

            const adminChan = client.channels.cache.get(client.config.dark.war.channelid);
            const tileWar = await tileWarModal.findOne({ guildID: interaction.guild.id });

            const arr = tileWar.currenlyWar.find(data => data.requestPannelID === interaction.message.id);

            if (!arr) {
                return interaction.editReply({ content: 'The war request has expired!', ephemeral: true });
            }

            const gangList = client.config.dark.war.gangs;
            const gangLeader = client.config.dark.war.gangLeader;

            const userIsGangLeader = interaction.member.roles.cache.some(role => gangLeader.includes(role.id));
            if (!userIsGangLeader) {
                return interaction.editReply({ content: 'You are not a leader of any gang!', ephemeral: true });
            }

            const userGangRoleId = gangList.find(roleId => interaction.member.roles.cache.has(roleId));
            const userGangRole = interaction.guild.roles.cache.get(userGangRoleId);
            if (!userGangRole) {
                return interaction.editReply({ content: 'You are a leader of a gang, but your gang role was not found!', ephemeral: true });
            }

            if (userGangRole.name.toLowerCase() !== arr.gang2.toLowerCase()) {
                return interaction.editReply({ content: 'You are not the leader of the gang that was requested for war!', ephemeral: true });
            }

            if (interaction.customId === "war-req-ack-agree") {

                const adminReqEmbed = new EmbedBuilder()
                    .setTitle('War Request Acknowledged')
                    .setDescription(`The war request between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})**`)
                    .setColor('Green');

                const adminReqRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('war-admin-approve')
                            .setLabel('Approve')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('war-admin-deny')
                            .setLabel('Deny')
                            .setStyle(ButtonStyle.Secondary),
                    );

                msg = await adminChan.send({
                    embeds: [adminReqEmbed],
                    components: [adminReqRow]
                });

                arr.pannelID = msg.id;
                await tileWar.save();

                const editEmbed = new EmbedBuilder()
                    .setTitle('War Request Acknowledged')
                    .setDescription(`The war request between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})** has been forwarded to admins`)
                    .setColor('Green');


                await interaction.message.edit({ embeds: [editEmbed], components: [] });
                return interaction.editReply({ content: 'The war request has been acknowledged and forwarded to admins!', ephemeral: true });
            }

            if (interaction.customId === "war-req-ack-disagree") {

                tileWar.currenlyWar = tileWar.currenlyWar.filter(data => data.requestPannelID !== interaction.message.id);
                await tileWar.save();

                const editEmbed = new EmbedBuilder()
                    .setTitle('War Request Denied')
                    .setDescription(`The war request between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})** has been denied`)
                    .setColor('Red');

                await interaction.message.edit({ embeds: [editEmbed], components: [] });
                return interaction.editReply({ content: 'The war request has been denied!', ephemeral: true });

            }
        }

        if (interaction.customId.includes("war-admin")) {

            await interaction.deferReply({ ephemeral: true });

            const tileWar = await tileWarModal.findOne({ guildID: interaction.guild.id });
            const arr = tileWar.currenlyWar.find(data => data.pannelID === interaction.message.id);

            if (!arr) {
                return interaction.editReply({ content: 'Error: The war request was not found!', ephemeral: true });
            }

            if (interaction.customId === "war-admin-approve") {

                arr.waractive = true;

                const count1 = tileWar.count.find(data => data.gang === arr.gang1);
                const count2 = tileWar.count.find(data => data.gang === arr.gang2);

                if (count1) {
                    count1.totalwar += 1;
                } else {
                    tileWar.count.push({ gang: arr.gang1, wins: 0, totalwar: 1 });
                }

                if (count2) {
                    count2.totalwar += 1;
                } else {
                    tileWar.count.push({ gang: arr.gang2, wins: 0, totalwar: 1 });
                }

                await tileWar.save();

                const approvalEmbed = new EmbedBuilder()
                    .setTitle('War Request Approved')
                    .setDescription(`The war has been approved between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})**\nby \`${interaction.user.username} | (${interaction.user.id})\``)
                    .setColor('Green');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`war-ended-${arr.gang1.toLowerCase()}`)
                            .setLabel(`Winner ${arr.gang1}`)
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`war-ended-${arr.gang2.toLowerCase()}`)
                            .setLabel(`Winner ${arr.gang2}`)
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`war-ended-draw`)
                            .setLabel(`Draw`)
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.message.edit({ embeds: [approvalEmbed], components: [row] });

                const annouceChannel = client.channels.cache.get(client.config.dark.war.announcechannel);
                const announceEmbed = new EmbedBuilder()
                    .setTitle('War Announcement')
                    .setDescription(`**${arr.gang1}** has declared war with **${arr.gang2}** at **${arr.warDate} (${arr.timing})**`)
                    .setColor('Red');

                await annouceChannel.send({ embeds: [announceEmbed] });

                return interaction.editReply({ content: 'The war request has been approved!', ephemeral: true });

            }

            if (interaction.customId === "war-admin-deny") {

                const denialEmbed = new EmbedBuilder()
                    .setTitle('War Request Denied')
                    .setDescription(`The war request between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})** has been denied\nby \`${interaction.user.username} | (${interaction.user.id})\``)
                    .setColor('Red');

                await interaction.message.edit({ embeds: [denialEmbed], components: [] });

                const annouceChannel = client.channels.cache.get(client.config.dark.war.announcechannel);
                const announceEmbed = new EmbedBuilder()
                    .setTitle('War Announcement')
                    .setDescription(`**${arr.gang1}**'s war request with **${arr.gang2}** has been denied`)
                    .setColor('Red');

                await annouceChannel.send({ embeds: [announceEmbed] });

                tileWar.currenlyWar = tileWar.currenlyWar.filter(data => data.pannelID !== interaction.message.id);
                await tileWar.save();

                return interaction.editReply({ content: 'The war request has been denied!', ephemeral: true });
            }
        }

        if (interaction.customId.includes("war-ended")) {

            await interaction.deferReply({ ephemeral: true });

            const tileWar = await tileWarModal.findOne({ guildID: interaction.guild.id });
            const arr = tileWar.currenlyWar.find(data => data.pannelID === interaction.message.id);

            if (!arr) {
                return interaction.editReply({ content: 'Error: The war request was not found!', ephemeral: true });
            }

            if (interaction.customId === `war-ended-${arr.gang1.toLowerCase()}`) {

                const confirmEmbed = new EmbedBuilder()
                    .setTitle('Confirm War Winner')
                    .setDescription(`Are you sure you want to confirm **${arr.gang1}** as the winner of the war?`)
                    .setColor('Red');

                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`war-confirm-${arr.gang1.toLowerCase()}`)
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`war-confirm-no`)
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger),
                    );

                msg = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });

                const collector = await msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 30000
                });

                collector.on('collect', async i => {
                    if (i.user.id === interaction.user.id) {

                        if (i.customId === `war-confirm-${arr.gang1.toLowerCase()}`) {

                            await i.deferReply({ ephemeral: true });

                            const winnerEmbed = new EmbedBuilder()
                                .setTitle('War Winner')
                                .setDescription(`**${arr.gang1}** has been declared as the winner of the war against **${arr.gang2}** at **${arr.warDate} (${arr.timing})**\nby \`${interaction.user.username} | (${interaction.user.id})\``)
                                .setColor('Green');

                            await interaction.message.edit({ embeds: [winnerEmbed], components: [] });

                            const annouceChannel = client.channels.cache.get(client.config.dark.war.announcechannel);
                            const announceEmbed = new EmbedBuilder()
                                .setTitle('War Announcement')
                                .setDescription(`**${arr.gang1}** has won the war against **${arr.gang2}** at **${arr.warDate} (${arr.timing})**`)
                                .setColor('Green');

                            await annouceChannel.send({ embeds: [announceEmbed] });

                            tileWar.currenlyWar = tileWar.currenlyWar.filter(data => data.pannelID !== interaction.message.id);
                            const count = tileWar.count.find(data => data.gang === arr.gang1);
                            count.wins += 1;
                            await tileWar.save();

                            await i.editReply({ content: 'The war winner has been confirmed!', embeds: [], components: [] });

                            collector.stop();
                        }

                        if (i.customId === `war-confirm-no`) {
                            await i.update({ content: 'The war winner confirmation has been cancelled!', embeds: [], components: [] });
                            collector.stop();
                        }
                    }
                });
            }

            if (interaction.customId === `war-ended-${arr.gang2.toLowerCase()}`) {

                const confirmEmbed = new EmbedBuilder()
                    .setTitle('Confirm War Winner')
                    .setDescription(`Are you sure you want to confirm **${arr.gang2}** as the winner of the war?`)
                    .setColor('Red');

                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`war-confirm-${arr.gang2.toLowerCase()}`)
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`war-confirm-no`)
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger),
                    );

                msg = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });

                const collector = await msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 30000
                });

                collector.on('collect', async i => {
                    if (i.user.id === interaction.user.id) {

                        if (i.customId === `war-confirm-${arr.gang2.toLowerCase()}`) {

                            await i.deferReply({ ephemeral: true });

                            const winnerEmbed = new EmbedBuilder()
                                .setTitle('War Winner')
                                .setDescription(`**${arr.gang2}** has been declared as the winner of the war against **${arr.gang1}** at **${arr.warDate} (${arr.timing})**\nby \`${interaction.user.username} | (${interaction.user.id})\``)
                                .setColor('Green');

                            await interaction.message.edit({ embeds: [winnerEmbed], components: [] });

                            const annouceChannel = client.channels.cache.get(client.config.dark.war.announcechannel);
                            const announceEmbed = new EmbedBuilder()
                                .setTitle('War Announcement')
                                .setDescription(`**${arr.gang2}** has won the war against **${arr.gang1}** at **${arr.warDate} (${arr.timing})**`)
                                .setColor('Green');

                            await annouceChannel.send({ embeds: [announceEmbed] });

                            tileWar.currenlyWar = tileWar.currenlyWar.filter(data => data.pannelID !== interaction.message.id);
                            const count = tileWar.count.find(data => data.gang === arr.gang2);
                            count.wins += 1;
                            await tileWar.save();

                            await i.editReply({ content: 'The war winner has been confirmed!', embeds: [], components: [] });

                            collector.stop();
                        }

                        if (i.customId === `war-confirm-no`) {
                            await i.update({ content: 'The war winner confirmation has been cancelled!', embeds: [], components: [] });
                            collector.stop();
                        }
                    }
                });
            }

            if (interaction.customId === "war-ended-draw") {

                const confirmEmbed = new EmbedBuilder()
                    .setTitle('Confirm War Draw')
                    .setDescription(`Are you sure you want to confirm the war between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})** as a draw?`)
                    .setColor('Red');

                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`war-confirm-draw`)
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`war-confirm-no`)
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger),
                    );

                msg = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });

                const collector = await msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 30000
                });

                collector.on('collect', async i => {
                    if (i.user.id === interaction.user.id) {

                        if (i.customId === `war-confirm-draw`) {

                            await i.deferReply({ ephemeral: true });

                            const drawEmbed = new EmbedBuilder()
                                .setTitle('War Draw')
                                .setDescription(`The war between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})** has been declared as a draw\nby \`${interaction.user.username} | (${interaction.user.id})\``)
                                .setColor('Green');

                            await interaction.message.edit({ embeds: [drawEmbed], components: [] });

                            const annouceChannel = client.channels.cache.get(client.config.dark.war.announcechannel);
                            const announceEmbed = new EmbedBuilder()
                                .setTitle('War Announcement')
                                .setDescription(`The war between **${arr.gang1}** and **${arr.gang2}** at **${arr.warDate} (${arr.timing})** has been declared as a draw`)
                                .setColor('Green');

                            await annouceChannel.send({ embeds: [announceEmbed] });

                            tileWar.currenlyWar = tileWar.currenlyWar.filter(data => data.pannelID !== interaction.message.id);
                            await tileWar.save();

                            await i.editReply({ content: 'The war draw has been confirmed!', embeds: [], components: [] });

                            collector.stop();
                        }

                        if (i.customId === `war-confirm-no`) {
                            await i.update({ content: 'The war draw confirmation has been cancelled!', embeds: [], components: [] });
                            collector.stop();
                        }
                    }
                });
            }
        }
    }
}