import { Schema, model } from "mongoose";
import { ILoginUser } from "../../../types";

const loginUserSchema = new Schema<ILoginUser>({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    discriminator: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpires: { type: Date },
}, { timestamps: true });

export default model('login-user', loginUserSchema);