import { Schema, model } from "mongoose";
import { IGangWar } from "../../../types";

const gangWarSchema = new Schema<IGangWar>({
    warLocation: { type: String, required: true },
    warStatus: { type: String, required: true, default: 'active' },
    combatants: [{
        gangName: { type: String, required: true },
        gangLeader: { type: String, required: true },
        gangLogo: { type: String, required: true },
        gangRole: { type: String, required: true },
        gangMembers: { type: Array, required: true }
    }],
    warEnd: { type: Date, required: false },
    timestamp: { type: Date, required: true, default: Date.now }
});

export default model('gang-war', gangWarSchema);