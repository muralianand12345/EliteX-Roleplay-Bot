# Iconic Discord Bot
**Official discord bot for Iconic Roleplay (Version 2.0)**

## Table of Contents
- [**Iconic-Roleplay-Bot:**](#iconic-roleplay-bot)
  - [**Table of Contents**](#table-of-contents)
  - [**Bot Features**](#bot-features)
  - [**Before You Start**](#before-you-start)
  - [**Software and Other 3rd Party Apps Used**](#software-and-other-3rd-party-apps-used)
  - [**Installation**](#installation)
  - [**About Code:**](#about-code)
    - [**Developer**](#developer)
    - [**Time Taken**](#time-taken)

## Bot Features:
- **Ticket System:**
  - Create, ticket options, close, delete, claim and reopen.
  - Discord channel like transcript with web-hosting.
  - Full customization (Image saving, ticket options, category and more).

- **Modmail:**
  - Thread based modmail.
  - Supporter role, annon reply.
 
- **Music Player:**
  - Lavalink music player (Slash command and search music channel)
  - Play, stop, pause, resume, skip and more.
  - Lavalink v4 (No delay - magmastream).

- **Birthday Wisher:**
  - User register birthday and wish automatically.
  - Optional user birthday year and age logging.

- **Button Role:**
  - Age declaration role.
  - More soon!

- **Visa Application: (RP Exclusive Feature)**
  - Fully custom visa application. (Modal)
  - User application log in MongoDB with userId.

- **Moderation:**
  - Ban on Leave. Role specific.
  - Reaction emoji moderation.
  - Welcome message with Image.
  - Goodbye message.
  - DM Welcome message.

- **Dashboard:**
  - Under development:
    - New React.js font page.
    - Config bot in webpage.
  - Currently html and css (partially working).

## Before You Start:
- This code has some redundancies and is frequently updated. Do not copy and paste the code without a good understanding of it.
- If you plan to remove a feature, ensure you also remove its dependencies.
- Running all the bot's features can lead to Discord API Cooldown and temporary bans.
- Please give credit when using my Discord bot in your server.
- A star would be greatly appreciated.

## Software and Other 3rd Party Apps Used:
- NodeJS.
- MongoDB Database.
- Yarn.

## Installation
- Make sure you have NodeJS and yarn installed.
- Node version 18 and above is preferred.
- Configure `./config/config.json`:<br>
**Note:** Remove `//command` text to avoid syntax error. 
```json
{
    "bot": {
        "owners": [
            "678402714765361182" //Owner ID
        ],
        "prefix": "-", //Your bots message prefix
        "deployslash": true, //Deploy slash command on run 1 time
        "deployslashRemove": false, //Remove slash commands for all guild 1 time 
        "stdchan": "", //Bot start log (can be same as logchan)
        "errchan": "", //Error log channel
        "logchan": "", //Log channel
        "cooldownMsg": "You are on `<duration>` cooldown!", //Cooldown message text must contain "<duration>"
        "presence": {
            "enabled": true,
            "status": "dnd", //online, invisible, idle
            "interval": 10000, //update each activity time
            "activity": [
                {
                    "name": "Indian Community",
                    "type": "Competing"
                },
                {
                    "name": "Iconic RolePlay ❤️",
                    "type": "Playing"
                },
                {
                    "name": "your Feedback and Suggestions!",
                    "type": "Listening"
                },
                {
                    "name": "<usersize> Users!",
                    "type": "Listening"
                },
                {
                    "name": "#tamilcommunityrp",
                    "type": "Competing"
                }
            ]
        }
    },
    "music": {
        "enabled": true,
        "embedcolor": "Blue", //Color text name or hexcode
        "image": "https://images2.alphacoders.com/110/thumb-1920-1109233.jpg", //Image for setup command
        "lavalink": {
            "defaultsearch": "youtube", //youtube, spotify, soundboard
            "nodes": [
                {
                    "identifier": "Lavalink",
                    "host": "localhost",
                    "port": 2333,
                    "password": "youshallnotpass",
                    "secure": false,
                    "retryAmount": 1000, //Retry after connection lost
                    "retrydelay": 10000,
                    "resumeStatus": false,
                    "resumeTimeout": 1000
                }
            ]
        }
    },
    "modmail": {
        "enabled": true,
        "server": "", //guild id for modmail to work
        "channelid": "", //admin channel
        "staffname": "Iconic RP Staff",
        "serverInvite": "https://discord.gg/iconic-roleplay" 
    },
    "banonleave": {
        "enabled": true //Ban user with specific role on leave
    },
    "welcome": {
        "welcomeuser": {
            "enabled": true,
            "message": "<a:welcome:1097130355137454181> {usermention} **Welcome to {server}** <a:welcome:1097130355137454181>\n\n<a:party:1097134575764914296> You are the {count} member of {server} <a:party:1097134575764914296>"
        },
        "goodbyemsg": {
            "enabled": true,
            "message": "Goodbye, {usermention}! We hope you enjoyed your stay at {server}!"
        },
        "welcomedm": {
            "enabled": true
        }
    },
    "agedeclaration": {
        "enabled": true,
        "serverInvite": "https://discord.gg/iconic-roleplay-1096848188935241878",
        "above18Img": "https://cdn.discordapp.com/attachments/1097420467532472340/1102470374702190623/18.png",
        "below18Img": "https://cdn.discordapp.com/attachments/1097420467532472340/1102472300181331978/18-.png"
    },
    "moderation": {
        "reactionmod": {
            "enabled": true,
            "emojitoremove": [ //banned emoji
                "💩",
                "🖕",
                "🤬",
                "🤡",
                "🖕🏻",
                "🖕🏼",
                "🖕🏽",
                "🖕🏾",
                "🖕🏿",
                "🤮",
                "🤢",
                "😈",
                "👿",
                "🦠",
                "🍆",
                "🍑",
                "🙊",
                "🖤",
                "🤖",
                "🚫",
                "😤",
                "👺",
                "👹",
                "😾"
            ],
            "logchannel": ""
        }
    },
    "birthday": {
        "enabled": true,
        "wishat": "5 0 * * *", //check at 12:05 am
        "timezone": "Asia/Kolkata",
        "webhooks": [
            "https://discord.com/api/webhooks/1180478xxxxx4121001/vKhbeN4Xxxxxxxxxxxxxxxxxxxxx_naspxxxxxxxxx_ZSrFhCGbEvxxxxxxxxxx1t"
        ]
    },
    "visaform": {
        "enabled": true,
        "logchannel": "",
        "context": { //Modal/Form questions
            "question1": {
                "label": "What is your Discord username?",
                "style": "short",
                "placeholder": "Username#0000",
                "required": true,
                "max": 100,
                "min": 1
            },
            "question2": {
                "label": "What is your Discord ID?",
                "style": "short",
                "placeholder": "123456789012345678",
                "required": true,
                "max": 100,
                "min": 1
            },
            "question3": {
                "label": "What is your age?",
                "style": "short",
                "placeholder": "18",
                "required": true,
                "max": 100,
                "min": 1
            },
            "question4": {
                "label": "What is your Rockstar Social Club ID?",
                "style": "short",
                "placeholder": "United States",
                "required": true,
                "max": 100,
                "min": 1
            },
            "question5": {
                "label": "What is your occupation?",
                "style": "short",
                "placeholder": "Employed at Iconic Roleplay",
                "required": true,
                "max": 100,
                "min": 1
            }
        }
    }
}
```
- Create `.env`:
```shell
TOKEN = Your Discord bot Token
DBURL = mongodb+srv://<your_username>:<password>@discordbot.someshit.mongodb.net/YourBot
SERVERADD = https://yourmom.somename.com
PORT = 69
```
- Install and run commands:
```shell
npm i -g yarn
yarn
node .
```

## About Code:

### Developer
- Murali Anand (murlee#0) **Owner/Dev**

### Time Taken
This code took more than a year to complete. You can also check out my previous projects on FiveM RP server bots and scripts.

[**Page Up**](#iconic-discord-bot)

[![DeepScan grade](https://deepscan.io/api/teams/21991/projects/25346/branches/791508/badge/grade.svg?token=a1fa0980263b30233c0ddf1e9c3ed778290db2ee)](https://deepscan.io/dashboard#view=project&tid=21991&pid=25346&bid=791508)
