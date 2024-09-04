import { Client, SlashCommandBuilder, CommandInteraction, Collection, ActivityType, PermissionResolvable, Message, AutocompleteInteraction, ChatInputCommandInteraction, ActivityType, Channel } from "discord.js"
import mongoose from "mongoose"
import discord from "discord.js"
import { BufferMemoryInput } from "langchain/memory"

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>
        commands: Collection<string, Command>,
        cooldowns: Collection<string, number>,
        logger: typeof logger,
        cmdLogger: typeof cmdLogger,
        config: JSON | any,
        discord: typeof discord
    }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string,
            MONGO_URI: string,
            SERVERADD: string,
            PORT: number
        }
    }
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args?) => void
}

export interface SlashCommand {
    data: typeof data,
    modal?: (interaction: ModalSubmitInteraction<CacheType>) => void,
    userPerms?: Array<PermissionResolvable>,
    botPerms?: Array<PermissionResolvable>,
    cooldown?: number,
    owner?: boolean,
    premium?: boolean,
    execute: (interaction: ChatInputCommandInteraction, client: Client) => void,
    autocomplete?: (interaction: AutocompleteInteraction, client: Client) => void,
}

export interface Command {
    name: string,
    description: string,
    userPerms?: Array<PermissionResolvable>,
    botPerms?: Array<PermissionResolvable>,
    cooldown?: number,
    owner?: boolean,
    premium?: boolean,
    execute: (client: Client, message: Message, args: Array<string>) => void
}

export interface Activity {
    name: string,
    type: ActivityType
}

export interface ColorData {
    name: string;
    hex: string;
    goodName: string;
}

export interface LimitedBufferMemoryOptions extends BufferMemoryInput {
    maxHistory: number,
    userId: string
}

//db

export interface IBotDataAnalysis extends mongoose.Document {
    clientId: string,
    restartCount: number,
    interactionCount: number,
    commandCount: number,
    server: Array<IServer>
}

export interface IServer {
    serverId: string,
    serverName: string,
    serverOwner: string,
    serverMemberCount: number,
    timeOfJoin: Date,
    active: boolean
}

export interface IBlockUser extends mongoose.Document {
    userId: string,
    status: boolean,
    data: Array<IBlockUserData>
}

export interface IBlockUserData {
    reason: string,
    date: Date
}

export interface ITicketUser extends mongoose.Document {
    userId: string,
    recentTicketId: string,
    ticketlog: Array<ITicketLog>
}

export interface ITicketLog {
    guildId: string,
    activeStatus: boolean,
    ticketNumber: number,
    ticketId: string,
    transcriptLink: string,
    ticketPanelId: string,
}

export interface ITicketGuild extends mongoose.Document {
    guildId: string,
    category: Array<ITicketCategory>,
    closedParent: string,
    ticketMaxCount: number,
    ticketCount: number,
    ticketSupportId: string,
    ticketLogId: string,
    ticketStatus: boolean
}

export interface ITicketCategory {
    label: string,
    value: string
    emoji: string
}

export interface IModmailUser extends mongoose.Document {
    userId: string,
    status: boolean,
    threadId: string | null,
    count: number
}

export interface IReactionMod extends mongoose.Document {
    userId: string,
    count: number,
    logs: Array<IReactionModLog>
}

export interface IReactionModLog {
    guildId: string,
    channelId: string,
    emoji: string,
    timestamp: Date
}

export interface IAgeDeclaration extends mongoose.Document {
    guildId: string,
    status: boolean,
    above18: string,
    below18: string,
    count: number
}

export interface IBirthday extends mongoose.Document {
    userId: string,
    day: number,
    month: number,
    year: number,
    age: number
}

export interface IPhoneNumber extends mongoose.Document {
    userId: string,
    phonenumber: number,
    status: boolean,
    timestamp: Date
}

export interface IVisaApplication extends mongoose.Document {
    userId: string,
    accepted: boolean,
    data: Array<IVisaApplicationData>
}

export interface IVisaApplicationData {
    applicationId: string,
    timestamp: Date,
    user_response: Array<IVisaApplicationResponse>
}

export interface IVisaApplicationResponse {
    question: string,
    answer: string
}

export interface IGangInit extends mongoose.Document {
    gangName: string,
    gangColor: string,
    gangLogo: string,
    gangLeader: string,
    gangRole: string,
    gangMembers: Array<IGangMembers>,
    gangCreated: Date,
    gangStatus: boolean
}

export interface IGangMembers {
    userId: string,
    gangJoinDate: Date
}

export interface IJobApplication extends mongoose.Document {
    userId: string,
    accepted: boolean,
    data: Array<IJobApplicationData>
}

export interface IJobApplicationData {
    jobValue: string,
    jobName: string,
    timestamp: Date,
    status: 'pending' | 'accepted' | 'rejected',
    user_response: Array<IJobApplicationResponse>
}

export interface IJobApplicationResponse {
    question: string,
    answer: string
}

export interface IGangWar extends mongoose.Document {
    warLocation: string,
    warStatus: 'pending' | 'active' | 'ended',
    combatants: Array<IGangWarCombatants>,
    warEnd: Date | null,
    timestamp: Date
}

export interface IGangWarCombatants {
    gangName: string,
    gangLeader: string,
    gangLogo: string,
    gangRole: string,
    gangMembers: Array<IGangMembers>
}

export interface GangWarLocation {
    name: string;
    value: string;
    emoji: string;
}