import { Schema, model } from "mongoose";
import { IVisaApplication } from "../../../types";

const visaApplicationSchema = new Schema<IVisaApplication>({
    userId: { type: String, required: true },
    accepted: { type: Boolean, required: true },
    data: [{
        applicationId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        user_response: [{
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }]
    }]
});

export default model('visa-application', visaApplicationSchema);