# Iconic Discord Bot
Official discord bot for Iconic Roleplay (Version 2)

## Table of Contents
- [Iconic-Roleplay-Bot](#iconic-roleplay-bot)
  - [Table of Contents](#table-of-contents)
  - [Bot Features:](#bot-features)
  - [Before You Start:](#before-you-start)
  - [Software and Other 3rd Party Apps Used:](#software-and-other-3rd-party-apps-used)
  -[Installation:](#installation)
  - [About Code:](#about-code)
    - [Developer](#developer)
    - [Time Taken](#time-taken)

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
- Configure `./config/config.json`.
- Create `.env`:
```shell
TOKEN = Your Discord bot Token
DBURL = mongodb+srv://<your_username>:<password>@discordbot.someshit.mongodb.net/YourBot
SERVERADD = https://yourbot.somename.com
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