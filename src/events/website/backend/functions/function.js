require("dotenv").config();

function checkLoggedIn(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/');
    }
}

async function fetchMessage(channel, messageId) {
    try {
        let message = await channel.messages.fetch(messageId);

        if (!message) {
            const messageFetcher = channel.messages.fetch({ after: messageId, limit: 50 });

            let messages = await messageFetcher;
            while (messages.size > 0) {
                message = messages.find(msg => msg.id === messageId);
                if (message) {
                    break;
                }
                messages = await messageFetcher;
            }
        }
        return message;
    } catch (error) {
        return null;
    }
}

function authenticateAPIKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.WEBKEY) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

module.exports = { checkLoggedIn, fetchMessage, authenticateAPIKey }