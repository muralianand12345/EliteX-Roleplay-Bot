const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const { Captcha } = require("discord.js-captcha");

module.exports = {
    cooldown: 10000,

    data: new SlashCommandBuilder()
        .setName('captcha')
        .setDescription("Verify yourself")
        .setDMPermission(false),
    async execute(interaction, client) {

        //log 
        const commandName = "CAPTCHA";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        //https://github.com/WillTDA/Discord.js-Captcha

        const captcha = new Captcha(client, {
            roleID: client.welcome.CAPTCHA.ROLE,
            channelID: client.welcome.CAPTCHA.CHANNEL,
            sendToTextChannel: client.welcome.CAPTCHA.SENDTOCHAN,
            addRoleOnSuccess: client.welcome.CAPTCHA.ADDROLE,
            kickOnFailure: client.welcome.CAPTCHA.KICK,
            caseSensitive: client.welcome.CAPTCHA.CASESENSITIVE,
            attempts: client.welcome.CAPTCHA.ATTEMPT,
            timeout: client.welcome.CAPTCHA.TIMEOUT,
            showAttemptCount: client.welcome.CAPTCHA.SHOWATTEMPT,
            /*customPromptEmbed: new EmbedBuilder(),
            customSuccessEmbed: new EmbedBuilder(), 
            customFailureEmbed: new EmbedBuilder(),*/
        });

        const member = interaction.member;
        captcha.present(interaction.member);
        await interaction.reply({ content: "Hello Welcome to the server!" });

        var logEmbed = new EmbedBuilder()
            .setDescription(`**<@${member.user.id}>** Captcha Log`)
            .setTimestamp();

        const logChannel = client.channels.cache.get(client.welcome.CAPTCHA.LOG.CHAN);
        if (!logChannel) return console.log(`Captcha Log Channel not found!`);

        if (!client.welcome.CAPTCHA.LOG.OPTIONS.SUCCESS) return;

        captcha.on("success", async (data) => {
            if (!client.welcome.CAPTCHA.LOG.OPTIONS.SUCCESS) return;
            logEmbed.setColor('Green')
                .addFields(
                    { name: "User", value: `${data.member.user.username}#${data.member.user.discriminator} (${data.member.user.id})` },
                    { name: "Status", value: "Success" },
                    { name: "Attempts", value: `${data.attempts}` },
                    { name: "Response", value: `${data.responses.toString()}` }
                )
                .setFooter({ text: `Answer: ${data.captchaText}` });
            logChannel.send({ embeds: [logEmbed] });
        });

        captcha.on("prompt", async (data) => {
            if (!client.welcome.CAPTCHA.LOG.OPTIONS.PROMPT) return;
            logEmbed.setColor('Yellow')
                .addFields(
                    { name: "User", value: `${data.member.user.username}#${data.member.user.discriminator} (${data.member.user.id})` },
                    { name: "Status", value: "Prompt" }
                )
                .setFooter({ text: `Answer: ${data.captchaText}` });
            logChannel.send({ embeds: [logEmbed] });
        });

        captcha.on("failure", async (data) => {
            if (!client.welcome.CAPTCHA.LOG.OPTIONS.FAILURE) return;
            logEmbed.setColor('Red')
                .addFields(
                    { name: "User", value: `${data.member.user.username}#${data.member.user.discriminator} (${data.member.user.id})` },
                    { name: "Status", value: "Failure" },
                    { name: "Attempts", value: `${data.attempts}` },
                    { name: "Response", value: `${data.responses.toString()}` }
                )
                .setFooter({ text: `Answer: ${data.captchaText}` });
            logChannel.send({ embeds: [logEmbed] });
        });

        captcha.on("timeout", async (data) => {
            if (!client.welcome.CAPTCHA.LOG.OPTIONS.TIMEOUT) return;
            logEmbed.setColor('Orange')
                .addFields(
                    { name: "User", value: `${data.member.user.username}#${data.member.user.discriminator} (${data.member.user.id})` },
                    { name: "Status", value: "Timeout" },
                    { name: "Attempts", value: `${data.attempts}` },
                    { name: "Response", value: `${data.responses.toString()}` }
                )
                .setFooter({ text: `Answer: ${data.captchaText}` });
            logChannel.send({ embeds: [logEmbed] });
        });
    }
};