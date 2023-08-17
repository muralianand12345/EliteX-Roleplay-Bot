const fs = require('fs');
const path = require('path');
require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Partials
} = require('discord.js');
const Errorhandler = require("discord-error-handler");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.User
    ],
    shards: 'auto',
    fetchAllMembers: true
});

const Token = process.env.TOKEN;
const WebhookId = process.env.WEBHOOK_ID;
const WebhookToken = process.env.WEBHOOK_TOKEN;

const handle = new Errorhandler(client, {
    webhook: { id: WebhookId, token: WebhookToken },
    stats: true,
});

const Discord = require('discord.js');
client.setMaxListeners(20);
client.discord = Discord;
client.handle = handle;

//logs
const modulesDir = path.join(__dirname, 'modules');
const files = fs.readdirSync(modulesDir);
for (const file of files) {
    if (path.extname(file) === '.js') {
        const property = path.basename(file, '.js');
        client[property] = require(path.join(modulesDir, file));
    }
}

//configs
const configDir = path.join(__dirname, 'config');
const folders = fs.readdirSync(configDir);
for (const folder of folders) {
    const folderPath = path.join(configDir, folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (path.extname(file) === '.json') {
                const property = path.basename(file, '.json');
                client[property] = require(path.join(folderPath, file));
            }
        }
    }
}

//Handler File Read
const handlersPath = path.join(__dirname, 'handlers');
fs.readdirSync(handlersPath).filter((dir) => {
    let files = fs.readdirSync(`${handlersPath}/${dir}`).filter((file) => file.endsWith(".js"));
    for (let file of files) {
        const handler = require(`${handlersPath}/${dir}/${file}`);
        client.on(handler.name, (...args) => handler.execute(...args, client));
    }
});

//events Read
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).forEach((mainDir) => {
    const mainDirPath = path.join(eventsPath, mainDir);
    const stat = fs.statSync(mainDirPath);
    if (stat.isDirectory()) {
        const subFolders = fs.readdirSync(mainDirPath);
        subFolders.forEach((subDir) => {
            const subDirPath = path.join(mainDirPath, subDir);
            const subStat = fs.statSync(subDirPath);
            if (subStat.isDirectory()) {
                const subFiles = fs.readdirSync(subDirPath);
                subFiles.forEach((file) => {
                    if (file.endsWith(".js")) {
                        const filePath = path.join(subDirPath, file);
                        const event = require(filePath);
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                });
            }
        });
    }
});

client.login(Token).catch(err => {
    console.error(`[TOKEN-CRASH] Unable to connect to the BOT's Token`.red);
    console.error(err);
    return process.exit();
});

module.exports = client;

//Error Handling
process.on('unhandledRejection', async (err, promise) => {
    handle.createrr(client, undefined, undefined, err);
});
process.on('uncaughtException', async (err, origin) => {
    handle.createrr(client, undefined, undefined, err);
});
client.on('invalidated', () => {
    console.log(`invalidated`);
});
client.on('invalidRequestWarning', (invalidRequestWarningData) => {
    console.log(`invalidRequestWarning: ${invalidRequestWarningData}`);
});