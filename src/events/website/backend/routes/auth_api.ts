import { Router, Response } from "express";
import axios from 'axios';
import jwt from 'jsonwebtoken';
import querystring from 'querystring';
import { verifyToken } from "../middlewares/auth";
import { client } from '../../../../bot';
import loginUserSchema from "../../../database/schema/loginUser";
import { AuthRequest } from "../../../../types";

const router = Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.CLIENT_REDIRECT_URI;
const JWT_SECRET = process.env.API_KEY;

const createToken = (user: any): string => {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET!, { expiresIn: '1d' });
};

router.post('/discord/login', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Missing authorization code' });
        }

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            querystring.stringify({
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI!,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, token_type, refresh_token } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token_type} ${access_token}`,
            },
        });

        const discordUser = userResponse.data;

        let user = await loginUserSchema.findOne({ discordId: discordUser.id });
        if (!user) {
            user = new loginUserSchema({
                discordId: discordUser.id,
                username: discordUser.username,
                email: discordUser.email,
                avatar: discordUser.avatar,
                discriminator: discordUser.discriminator,
                accessToken: access_token,
                refreshToken: refresh_token,
            });
            await user.save();
        } else {
            user.accessToken = access_token;
            user.refreshToken = refresh_token;
            await user.save();
        }

        const token = createToken(user);

        res.json({
            message: 'Successfully authenticated with Discord',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            },
        });

    } catch (error: Error | any) {
        client.logger.error(`Error in /discord/login: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Missing refresh token' });
        }

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            querystring.stringify({
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;

        const user = await loginUserSchema.findOneAndUpdate(
            { refreshToken: refreshToken },
            { accessToken: access_token, refreshToken: refresh_token },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const token = createToken(user);

        res.json({
            message: 'Token refreshed successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            },
        });

    } catch (error: Error | any) {
        client.logger.error(`Error in /refresh-token: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await loginUserSchema.findByIdAndUpdate(req.userId, {
            $unset: { accessToken: "", refreshToken: "" }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Logged out successfully' });

    } catch (error: Error | any) {
        client.logger.error(`Error in /logout: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/profile', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await loginUserSchema.findById(req.userId).select('-accessToken -refreshToken');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error: Error | any) {
        client.logger.error(`Error in /profile: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;