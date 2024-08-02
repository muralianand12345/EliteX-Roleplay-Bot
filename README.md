# Discord Ticket Bot
**An advanced Ticket Bot for Roleplay servers**

## Table of Contents
- [Discord Ticket Bot](#discord-ticket-bot)
  - [Table of Contents](#table-of-contents)
  - [Bot Features](#bot-features)
  - [Software and Applications used](#software-and-applications-used)
  - [Before you start](#before-you-start)
  - [Installation:](#installation)
  - [About Code:](#about-code)
    - [Common Bugs:](#common-bugs)
    - [Developer](#developer)
    - [Version](#version)

## Bot Features
- Multi-Guild bot, can be used to do ticket supporting on multiple servers.
- Reopen and claim ticket feature.
- Ticket logging and hosting.
- And more ...

## Software and Applications used
- NodeJS (Typescript)
- MongoDB
- Yarn (alternative for NPM)

## Before you start
- Make sure you have installed NodeJS v16 or above in your system.
- Install all necessary packages:
```bash
npm i -g yarn typescript
```
## Installation:
- Rename `.env.example` to `.env` and fill all the necessary credentials.
- Type the following in your terminal:
```bash
yarn --production
tsc
```
- Go to `/build/config/config.json` file and fill in all the necessary credentials.
- To run the application, just type `node .` in your terminal.

## About Code:

### Common Bugs:

```bash
[ERROR] [Error: ENOENT: no such file or directory, open 'C:\Users\username\path\Discord-Ticket-Bot\build\events\website\ticket-logs\transcript-123456789.html'] {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'C:\Users\username\path\Discord-Ticket-Bot\build\events\website\ticket-logs\transcript-123456789.html'
}
```
- Answer: Create `ticket-logs` folder in `Discord-Ticket-Bot\build\events\website` directory.

### Developer
- Murali Anand (murlee#0)

### Version

💠 x1.x2.x3.x3

- x1 - Major update<br>
- x2 - Minor updates and new feature<br>
- x3 - Major bug fix and improvements<br>
- x4 - Minor bug fix<br>
- beta - testing


[**Page Up**](#discord-ticket-bot)