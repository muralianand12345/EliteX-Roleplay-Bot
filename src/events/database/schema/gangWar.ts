import { Schema, model } from "mongoose";
import { IGangWar } from "../../../types";

const gangWarSchema = new Schema<IGangWar>({
    location: { type: String, required: true },
    combatants: [{
        gangName: { type: String, required: true },
        gangLeader: { type: String, required: true },
        gangLogo: { type: String, required: true },
        gangRole: { type: String, required: true },
        type: { type: String, required: true, enum: ['attacker', 'defender'] },
        gangMembers: { type: Array, required: true }
    }],
    warStatus: { type: String, required: true, enum: ['pending', 'active', 'ended'], default: 'pending' },
    warStart: { type: Date, required: false },
    warEnd: { type: Date, required: false },
    approvedBy: { type: String, required: false, default: null },
    resolvedBy: { type: String, required: false, default: null },
});

export default model('gang-war-data', gangWarSchema);