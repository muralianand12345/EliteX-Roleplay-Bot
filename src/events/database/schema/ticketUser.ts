import { Schema, model } from "mongoose";
import { ITicketUser } from "../../../types";

const ticketUserSchema = new Schema<ITicketUser>({
    userId: { type: String, required: true },
    recentTicketId: { type: String, required: false },
    ticketlog: [{
        guildId: { type: String, required: true },
        activeStatus: { type: Boolean, default: true, required: true },
        ticketNumber: { type: Number, required: true },
        ticketId: { type: String, required: true },
        transcriptLink: { type: String, required: false },
        ticketPannelId: { type: String, required: true },
        tticketData: {
            messages: [{
                userId: { type: String, required: true },
                username: { type: String, required: true },
                content: { type: String, required: true },
                timestamp: { type: Date, default: Date.now, required: true },
            }],
        },
        timestamp: { type: Date, default: Date.now, required: false },
    }]
});

export default model('ticket-user', ticketUserSchema);