import { Schema, model } from "mongoose";
import { IPhoneNumber } from "../../../types";

const phonenumberSchema = new Schema<IPhoneNumber>({
    userId: { type: String, required: true },
    phonenumber: { type: Number, required: false },
    status: { type: Boolean, required: true, default: false },
    timestamp: { type: Date, required: false, default: Date.now }
});

export default model('phonenumber-user', phonenumberSchema);